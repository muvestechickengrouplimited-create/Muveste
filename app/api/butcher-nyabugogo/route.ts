import { NextResponse } from 'next/server';
import { prependRow, getRows } from '../../../lib/sheets';
import { formatDate, formatTime } from '../../../lib/utils';
import admin from '../../../lib/firebase-admin';

export const dynamic = 'force-dynamic';

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

    const userEmail = decodedToken.email?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized: No email associated with token' },
        { status: 401 }
      );
    }

    // Role check: Only butcher or admin can submit
    const isAuthorized =
      userEmail.includes('nyabugogo') ||
      userEmail.includes('admin');
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions for butcher' },
        { status: 403 }
      );
    }

    // 2. Parse and validate form data
    const body = await request.json();
    const {
      date,
      meatReceived,
      meatSold,
      pricePerKg,
      damaged,
      expenses,
      notes,
    } = body;

    if (
      date === undefined ||
      meatReceived === undefined ||
      meatSold === undefined ||
      pricePerKg === undefined ||
      damaged === undefined ||
      expenses === undefined
    ) {
      return NextResponse.json(
        { error: 'Bad Request: Missing required data fields' },
        { status: 400 }
      );
    }

    // 3. Fetch previous stock
    let previousStock = 0;
    try {
      const allRows = await getRows('butcher-nyabugogo', true); // Bypass cache to get real-time stock
      if (allRows && allRows.length > 1) {
        // Find latest row
        // Rows: Date, Received, Sold, Price, Damaged, Left, Exp, Total, Profit...
        const locationRows = allRows.slice(1)
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
        
        if (locationRows.length > 0) {
          previousStock = parseNum(locationRows[0][5]); // Stock Left from most recent record
        }
      }
    } catch (e) {
      console.warn('Failed to fetch previous stock for butcher:', e);
    }

    // 4. Server-side calculations (authoritative)
    // New Logic: Total Sales = Meat Sold * Price
    // Stock Left = Previous Stock + Meat Received - Meat Sold - Damaged
    const mRec = parseNum(meatReceived);
    const mSold = parseNum(meatSold);
    const mPrc = parseNum(pricePerKg);
    const mDmg = parseNum(damaged);
    const mExp = parseNum(expenses);

    const totalSales = mSold * mPrc;
    const stockLeft = previousStock + mRec - mSold - mDmg;
    // Profit = Total Sales - Butcher Expenses
    const profit = totalSales - mExp;
    const now = new Date();

    // 5. Values order must match sheet headers exactly:
    // 0:Date | 1:Meat Received (kg) | 2:Meat Sold (kg) | 3:Price/kg (RWF) | 4:Damaged (kg)
    // 5:Stock left(kgs) | 6:Expenses (RWF) | 7:Total Sales (RWF) | 8:Profit (RWF) | 9:Notes 
    // 10:Submitted By | 11:Timestamp
    const rowData = [
      date,
      mRec,
      mSold,
      mPrc,
      mDmg,
      stockLeft,
      mExp,
      totalSales,
      profit,
      notes || '',
      userEmail,
      now.toISOString(),
    ];

    await prependRow('butcher-nyabugogo', rowData);

    // 5. Log to admin-log tab
    await prependRow('admin-log', [
      formatDate(now),
      formatTime(now),
      'butcher-nyabugogo',
      'Daily report submitted',
      userEmail,
      'Submitted',
      now.toISOString(),
    ]);

    return NextResponse.json({ success: true, totalSales, profit }, { status: 201 });
  } catch (error: any) {
    console.error('API Error in butcher/route.ts [POST]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ─── GET — fetch records ───────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // 'monthly' | null

    // Fetch all rows from the butcher sheet (row 0 is headers), bypass cache
    const rows = await getRows('butcher-nyabugogo', true);
    if (!rows || rows.length <= 1) {
      if (period === 'monthly') {
        return NextResponse.json({
          totalMeatSold: 0,
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

    // Each row: [Date, Meat Received, Meat Sold, Price/kg, Damaged, Expenses, Total Sales, Profit, Notes, Submitted By, Timestamp]
    const today = new Date();

    // --- Monthly totals ---
    if (period === 'monthly') {
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();

      let totalMeatSold = 0;
      let totalSales = 0;
      let totalExpenses = 0;
      let totalDamaged = 0;
      let netProfit = 0;

      for (const row of dataRows) {
        const rowDate = new Date(row[0]);
        if (
          !isNaN(rowDate.getTime()) &&
          rowDate.getMonth() === thisMonth &&
          rowDate.getFullYear() === thisYear
        ) {
          totalMeatSold += parseNum(row[2]);
          totalSales += parseNum(row[7]); // Updated index
          totalExpenses += parseNum(row[6]); // Butcher Exp
          totalDamaged += parseNum(row[4]);
          netProfit += parseNum(row[8]); // Updated index
        }
      }

      return NextResponse.json({
        totalMeatSold,
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
        date: row[0] ?? '',
        meatReceived: parseNum(row[1]),
        meatSold: parseNum(row[2]),
        pricePerKg: parseNum(row[3]),
        damaged: parseNum(row[4]),
        stockLeft: parseNum(row[5]),
        expenses: parseNum(row[6]),
        totalSales: parseNum(row[7]),
        profit: parseNum(row[8]),
        notes: row[9] ?? '',
        submittedBy: row[10] ?? '',
        timestamp: row[11] ?? '',
      }))
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

    return NextResponse.json({ success: true, data: recent });
  } catch (error: any) {
    console.error('API Error in butcher/route.ts [GET]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
