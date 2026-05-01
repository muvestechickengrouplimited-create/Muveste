import { NextResponse } from 'next/server';
import { prependRow, getRows } from '../../../lib/sheets';
import { formatDate, formatTime } from '../../../lib/utils';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin using environment variables if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      // Replace literal \n with actual newlines in case it's escaped in env vars
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
    }),
  });
}

// ─── Helper ────────────────────────────────────────────────────────────────
function parseNum(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const n = Number(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

// ─── POST — append one row ─────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    // 1. Verify Firebase Auth Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token format' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userEmail = decodedToken.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized: No email associated with token' },
        { status: 401 }
      );
    }

    // Role check: Only egg_kiosk or admin can submit
    const isAuthorized =
      userEmail.toLowerCase() === 'eggkiosk@30plus.rw' ||
      userEmail.toLowerCase() === 'admin@30plus.rw';
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions for Egg Kiosk' },
        { status: 403 }
      );
    }

    // 2. Parse and validate form data
    const body = await request.json();
    const {
      location,
      date,
      traysReceived,
      traysSold,
      pricePerTray,
      damagedTrays,
      expenses,
      notes,
    } = body;

    if (
      location === undefined ||
      date === undefined ||
      traysReceived === undefined ||
      traysSold === undefined ||
      pricePerTray === undefined ||
      damagedTrays === undefined ||
      expenses === undefined
    ) {
      return NextResponse.json(
        { error: 'Bad Request: Missing required data fields' },
        { status: 400 }
      );
    }

    // 3. Fetch previous stock for the selected location
    let previousStock = 0;
    try {
      const allRows = await getRows('egg-kiosk', true); // Bypass cache to get real-time stock
      if (allRows && allRows.length > 1) {
        // Find latest row for this location
        // Rows: Date, Location, Received, Sold, Price, Damaged, Exp, Total, Left, Profit...
        const locationRows = allRows.slice(1)
            .filter(r => r[1] === location)
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
        
        if (locationRows.length > 0) {
          previousStock = parseNum(locationRows[0][8]); // Trays Left from most recent record
        }
      }
    } catch (e) {
      console.warn('Failed to fetch previous stock for egg kiosk:', e);
    }

    // 4. Server-side calculations (authoritative)
    const totalSales = parseNum(traysSold) * parseNum(pricePerTray);
    const profit = totalSales - parseNum(expenses);
    const now = new Date();

    // 5. Values order must match sheet headers exactly:
    // Date | Location | Trays Received | Trays Sold | Price/Tray (RWF) | Damaged Trays
    // | Expenses (RWF) | Total Sales (RWF) | Trays Left | Profit (RWF) | Notes | Finance Expenses (RWF) | Submitted By | Timestamp
    const traysLeft = Math.round((previousStock + parseNum(traysReceived) - parseNum(traysSold) - parseNum(damagedTrays)) * 100) / 100;
    const rowData = [
      date,
      location,
      parseNum(traysReceived),
      parseNum(traysSold),
      parseNum(pricePerTray),
      parseNum(damagedTrays),
      parseNum(expenses),
      totalSales,
      traysLeft,
      profit,
      notes || '',
      0, // Finance Expenses (RWF) - placeholder
      userEmail,
      now.toISOString(),
    ];

    await prependRow('egg-kiosk', rowData);

    // 5. Log to admin-log tab
    await prependRow('admin-log', [
      formatDate(now),
      formatTime(now),
      'Egg Kiosk',
      'Daily report submitted',
      userEmail,
      'Submitted',
      now.toISOString(),
    ]);

    return NextResponse.json({ success: true, totalSales, profit }, { status: 201 });
  } catch (error: unknown) {
    console.error('API Error in egg-kiosk/route.ts [POST]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ─── GET — fetch records ───────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // 'monthly' | null

    // Fetch all rows from the egg-kiosk sheet (row 0 is headers), bypass cache
    const rows = await getRows('egg-kiosk', true);
    if (!rows || rows.length <= 1) {
      if (period === 'monthly') {
        return NextResponse.json({
          totalTraysSold: 0,
          totalSales: 0,
          totalExpenses: 0,
          totalDamaged: 0,
          netProfit: 0,
        });
      }
      return NextResponse.json([]);
    }

    // Skip header row (index 0)
    const dataRows = rows.slice(1);

    // Each row: [Date, Location, Trays Received, Trays Sold, Price/Tray, Damaged Trays, Expenses, Total Sales, Profit, Notes, Submitted By, Timestamp]
    const today = new Date();

    // --- Monthly totals ---
    if (period === 'monthly') {
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();

      let totalTraysSold = 0;
      let totalSales    = 0;
      let totalExpenses = 0;
      let totalDamaged  = 0;
      let netProfit     = 0;

      for (const row of dataRows) {
        const rowDate = new Date(row[0]);
        if (
          !isNaN(rowDate.getTime()) &&
          rowDate.getMonth() === thisMonth &&
          rowDate.getFullYear() === thisYear
        ) {
          totalTraysSold += parseNum(row[3]);
          totalSales += parseNum(row[7]);
          totalExpenses += parseNum(row[6]);
          totalDamaged  += parseNum(row[5]);
          netProfit     += parseNum(row[8]);
        }
      }

      return NextResponse.json({
        totalTraysSold,
        totalSales,
        totalExpenses,
        totalDamaged,
        netProfit,
      });
    }

    // --- Last 30 days, sorted newest first ---
    const cutoff30 = new Date(today);
    cutoff30.setDate(cutoff30.getDate() - 30);

    const recent = dataRows
      .filter((row) => {
        const rowDate = new Date(row[0]);
        return !isNaN(rowDate.getTime()) && rowDate >= cutoff30;
      })
      .map((row) => ({
        date:             row[0]  ?? '',
        location:         row[1]  ?? '',
        traysReceived:    parseNum(row[2]),
        traysSold:        parseNum(row[3]),
        pricePerTray:     parseNum(row[4]),
        damagedTrays:     parseNum(row[5]),
        expenses:         parseNum(row[6]),
        totalSales:       parseNum(row[7]),
        traysLeft:        parseNum(row[8]),
        profit:           parseNum(row[9]),
        notes:            row[10] ?? '',
        financeExpenses:  parseNum(row[11]),
        submittedBy:      row[12] ?? '',
        timestamp:        row[13] ?? '',
      }))
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

    return NextResponse.json({ success: true, data: recent });
  } catch (error: unknown) {
    console.error('API Error in egg-kiosk/route.ts [GET]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
