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
      userEmail.includes('kibungo') ||
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
      buyingPricePerKg,
      meatSold,
      sellingPricePerKg,
      damaged,
      expenses,
      previousStock = 0,
      notes,
    } = body;

    if (
      date === undefined ||
      meatReceived === undefined ||
      buyingPricePerKg === undefined ||
      meatSold === undefined ||
      sellingPricePerKg === undefined ||
      damaged === undefined ||
      expenses === undefined
    ) {
      return NextResponse.json(
        { error: 'Bad Request: Missing required data fields' },
        { status: 400 }
      );
    }

    // 4. Server-side calculations (authoritative)
    const mRec = parseNum(meatReceived);
    const mBuyPrc = parseNum(buyingPricePerKg);
    const mSold = parseNum(meatSold);
    const mSelPrc = parseNum(sellingPricePerKg);
    const mDmg = parseNum(damaged);
    const mExp = parseNum(expenses);

    const totalCost = mRec * mBuyPrc;
    const totalSales = mSold * mSelPrc;
    const profit = totalSales - totalCost - mExp;
    const stockLeft = Number(previousStock) + mRec - mSold - mDmg;
    const now = new Date();

    const rowData = [
      date,
      mRec,
      mBuyPrc,
      totalCost,
      mSold,
      mSelPrc,
      mDmg,
      mExp,
      totalSales,
      profit,
      stockLeft,
      notes || '',
      userEmail,
      now.toISOString(),
    ];

    await prependRow('butcher-kibungo', rowData);

    // 5. Log to admin-log tab
    await prependRow('admin-log', [
      formatDate(now),
      formatTime(now),
      'butcher-kibungo',
      'Daily report submitted',
      userEmail,
      'Submitted',
      now.toISOString(),
    ]);

    return NextResponse.json({ success: true, totalSales, profit, stockLeft }, { status: 201 });
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
    const lastStock = searchParams.get('lastStock');

    // Fetch all rows from the butcher sheet (row 0 is headers), bypass cache
    const rows = await getRows('butcher-kibungo', true);
    
    if (lastStock === '1') {
      if (!rows || rows.length <= 1) {
        return NextResponse.json({ previousStock: 0 });
      }
      const dataRows = rows.slice(1);
      const forDate = searchParams.get('forDate'); // e.g. '2026-05-14'

      if (forDate) {
        const targetDate = new Date(forDate);
        const targetDateStr = forDate;

        const parsed = dataRows
          .map(row => ({ 
            date: (row[0] || '').split('T')[0], 
            meatReceived: parseNum(row[1]),
            buyingPricePerKg: parseNum(row[2]),
            meatSold: parseNum(row[4]),
            sellingPricePerKg: parseNum(row[5]),
            damaged: parseNum(row[6]),
            expenses: parseNum(row[7]),
            stockLeft: parseNum(row[10]),
            notes: row[11] || ''
          }))
          .filter(r => !isNaN(new Date(r.date).getTime()));

        // 1. Get the real 'previousStock' (the most recent row strictly BEFORE this date)
        const before = parsed
          .filter(r => new Date(r.date) < targetDate)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const previousStock = before.length > 0 ? before[0].stockLeft : 0;

        // 2. Check if a report already exists ON this date (for editing/viewing)
        const sameDay = parsed.find(r => r.date === targetDateStr);

        return NextResponse.json({ 
          previousStock, 
          existingData: sameDay || null 
        });
      }

      // Fallback: no date specified — return most recent row's stock
      const lastRow = dataRows[0];
      const previousStock = parseFloat(lastRow?.[10]) || 0;
      return NextResponse.json({ previousStock });
    }

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
          totalMeatSold += parseNum(row[4]);
          totalSales += parseNum(row[8]); 
          totalExpenses += parseNum(row[7]); 
          totalDamaged += parseNum(row[6]);
          netProfit += parseNum(row[9]); 
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
        buyingPricePerKg: parseNum(row[2]),
        totalCost: parseNum(row[3]),
        meatSold: parseNum(row[4]),
        sellingPricePerKg: parseNum(row[5]),
        damaged: parseNum(row[6]),
        expenses: parseNum(row[7]),
        totalSales: parseNum(row[8]),
        profit: parseNum(row[9]),
        stockLeft: parseNum(row[10]),
        notes: row[11] ?? '',
        submittedBy: row[12] ?? '',
        timestamp: row[13] ?? '',
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
