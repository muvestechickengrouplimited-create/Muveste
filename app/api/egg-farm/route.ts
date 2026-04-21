import { NextResponse } from 'next/server';
import { prependRow, getRows } from '../../../lib/sheets';
import { formatDate, formatTime } from '../../../lib/utils';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin using environment variables if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

    // Role check: Only egg_farm or admin can submit
    const isAuthorized =
      userEmail.toLowerCase() === 'eggfarm@30plus.rw' ||
      userEmail.toLowerCase() === 'admin@30plus.rw';
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions for Egg Farm' },
        { status: 403 }
      );
    }

    // 2. Parse and validate form data
    const body = await request.json();
    const {
      date,
      feedQty,
      water,
      medicationsGiven,
      newBirds, // Added
      birdsSold,
      priceOfBirdsSold,
      mortality, // Added
      freshEggs,
      pricePerFreshEgg,
      checkedEggs,
      pricePerCheckedEgg,
      brokenEggs,
      totalEggs,
      freshEggsSold,
      checkedEggsSold,
      avgWeight,
      feedPrice,
      expenses,
      revenue,
      rateOfLay,
      notes,
    } = body;

    if (
      date === undefined ||
      feedQty === undefined ||
      water === undefined ||
      freshEggs === undefined ||
      brokenEggs === undefined ||
      feedPrice === undefined
    ) {
      return NextResponse.json(
        { error: 'Bad Request: Missing required production fields' },
        { status: 400 }
      );
    }

    const serverCalculatedExpenses = parseNum(feedQty) * parseNum(feedPrice);
    const now = new Date();

    // We will trust the client's liveBirds and stock for simplicity (like Egg Kiosk)
    const clientLiveBirds = parseNum(body.liveBirds);
    const clientFreshEggsLeftInStock = parseNum(body.freshEggsLeftInStock);
    const clientCheckedEggsLeftInStock = parseNum(body.checkedEggsLeftInStock);

    const clientProfit = parseNum(revenue) - serverCalculatedExpenses;

    const rowData = [
      date,                       // 0
      parseNum(feedQty),          // 1
      parseNum(feedPrice),        // 2
      parseNum(water),            // 3
      medicationsGiven || '',     // 4
      parseNum(newBirds),         // 5
      parseNum(birdsSold),        // 6
      parseNum(priceOfBirdsSold), // 7
      parseNum(mortality),        // 8
      clientLiveBirds,            // 9
      parseNum(freshEggs),        // 10
      parseNum(pricePerFreshEgg), // 11
      parseNum(checkedEggs),      // 12
      parseNum(pricePerCheckedEgg),// 13
      parseNum(brokenEggs),       // 14
      parseNum(totalEggs),        // 15
      parseNum(freshEggsSold),    // 16
      parseNum(checkedEggsSold),  // 17
      clientFreshEggsLeftInStock, // 18
      clientCheckedEggsLeftInStock, // 19
      parseNum(avgWeight),        // 20
      serverCalculatedExpenses,   // 21
      parseNum(revenue),          // 22
      clientProfit,               // 23
      parseNum(rateOfLay),        // 24
      notes || '',                // 25
      userEmail,                  // 26
      now.toISOString(),          // 27
    ];

    await prependRow('egg-farm', rowData);

    // 5. Log to admin-log tab
    await prependRow('admin-log', [
      formatDate(now),
      formatTime(now),
      'Egg Farm',
      'Daily report submitted',
      userEmail,
      'Submitted',
      now.toISOString(),
    ]);

    return NextResponse.json({ success: true, revenue }, { status: 201 });
  } catch (error: unknown) {
    console.error('API Error in egg-farm/route.ts [POST]:', error);
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
    const period = searchParams.get('period'); 

    const rows = await getRows('egg-farm');

    // ─── Fetch LAST row for compounding logic ────────────────────────────────
    if (searchParams.get('last') === '1') {
      const dataRows = (rows && rows.length > 1) ? rows.slice(1) : []; // skip header
      const lastRow = dataRows[0]; // newest first
      if (lastRow) {
        const isRateOfLayAdded = lastRow.length >= 28;
        const isBirdsSoldFmt = lastRow.length === 27;
        const isDoubleStockFmt = lastRow.length === 26 || lastRow.length === 25;
        const isProfitFmt = lastRow.length === 24;
        const isNewest = lastRow.length === 23;
        const isInter = lastRow.length === 22;
        const isNewFormat = isRateOfLayAdded || isBirdsSoldFmt || isDoubleStockFmt || isProfitFmt || isNewest || isInter;
        return NextResponse.json({
          liveBirds: isNewFormat ? parseNum(lastRow[isRateOfLayAdded || isBirdsSoldFmt ? 9 : 7]) : 0,
          freshEggsLeftInStock: (isRateOfLayAdded || isBirdsSoldFmt) ? parseNum(lastRow[18]) : (isDoubleStockFmt ? parseNum(lastRow[16]) : (isProfitFmt || isNewest ? parseNum(lastRow[16]) : (isInter ? parseNum(lastRow[15]) : 0))),
          checkedEggsLeftInStock: (isRateOfLayAdded || isBirdsSoldFmt) ? parseNum(lastRow[19]) : (isDoubleStockFmt ? parseNum(lastRow[17]) : 0),
          lastAvgWeight: parseNum(lastRow[(isRateOfLayAdded || isBirdsSoldFmt) ? 20 : (isDoubleStockFmt ? 18 : (isProfitFmt || isNewest ? 17 : (isInter ? 16 : 11)))]),
        });
      }
      return NextResponse.json({ liveBirds: 0, eggsLeftInStock: 0, lastAvgWeight: 0 });
    }

    if (!rows || rows.length <= 1) {
      if (period === 'monthly') {
        return NextResponse.json({
          totalEggs: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
        });
      }
      return NextResponse.json([]);
    }

    const dataRows = rows.slice(1);
    const today = new Date();
    const cutoff30 = new Date(today);
    cutoff30.setDate(cutoff30.getDate() - 30);

    // --- Monthly totals ---
    if (period === 'monthly') {
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();

      let totalEggs       = 0;
      let totalRevenue     = 0;
      let totalExpenses    = 0;

      for (const row of dataRows) {
        const rowDate = new Date(row[0]);
        if (
          !isNaN(rowDate.getTime()) &&
          rowDate.getMonth() === thisMonth &&
          rowDate.getFullYear() === thisYear
        ) {
          const isRateOfLayAdded = row.length >= 28;
          const isBirdsSoldFmt = row.length === 27;
          const isDoubleStockFmt = row.length === 26 || row.length === 25;
          const isProfitFmt = row.length === 24;
          const isNewest = row.length === 23;
          const isInter = row.length === 22;
          const isNew = isRateOfLayAdded || isBirdsSoldFmt || isDoubleStockFmt || isProfitFmt || isNewest || isInter;
          
          totalEggs    += parseNum(row[(isRateOfLayAdded || isBirdsSoldFmt) ? 15 : (isNew ? 13 : 10)]); 
          totalRevenue  += parseNum(row[(isRateOfLayAdded || isBirdsSoldFmt) ? 22 : (isDoubleStockFmt ? 20 : (isProfitFmt ? 19 : (isNewest ? 19 : (isInter ? 18 : 13))))]); 
          totalExpenses += parseNum(row[(isRateOfLayAdded || isBirdsSoldFmt) ? 21 : (isDoubleStockFmt ? 19 : (isProfitFmt ? 18 : (isNewest ? 18 : (isInter ? 17 : 12))))]); 
        }
      }

      return NextResponse.json({
        totalEggs,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
      });
    }

    // --- Last 30 days, sorted newest first ---
    const recent = dataRows
      .filter((row) => {
        const rowDate = new Date(row[0]);
        return !isNaN(rowDate.getTime()) && rowDate >= cutoff30;
      })
      .map((row) => {
        const isRateOfLayAdded = row.length >= 28;
        const isBirdsSoldFmt = row.length === 27;
        const isDoubleStockFmt = row.length === 26 || row.length === 25;
        const isProfitFmt = row.length === 24;
        const isNewest = row.length === 23;
        const isInter = row.length === 22;
        const isNew = isRateOfLayAdded || isBirdsSoldFmt || isDoubleStockFmt || isProfitFmt || isNewest || isInter;
        
        return {
          date: row[0] ?? '',
          feedQty: parseNum(row[1]),
          feedPrice: parseNum(row[2]),
          water: parseNum(row[3]),
          medicationsGiven: row[4] ?? '',
          newBirds: isNew ? parseNum(row[5]) : 0,
          birdsSold: isBirdsSoldFmt ? parseNum(row[6]) : 0,
          priceOfBirdsSold: isBirdsSoldFmt ? parseNum(row[7]) : 0,
          mortality: isNew ? parseNum(row[isBirdsSoldFmt ? 8 : 6]) : 0,
          liveBirds: isNew ? parseNum(row[isBirdsSoldFmt ? 9 : 7]) : 0,
          freshEggs: parseNum(row[isBirdsSoldFmt ? 10 : (isNew ? 8 : 5)]),
          pricePerFreshEgg: parseNum(row[isBirdsSoldFmt ? 11 : (isNew ? 9 : 6)]),
          checkedEggs: parseNum(row[isBirdsSoldFmt ? 12 : (isNew ? 10 : 7)]),
          pricePerCheckedEgg: parseNum(row[isBirdsSoldFmt ? 13 : (isNew ? 11 : 8)]),
          brokenEggs: parseNum(row[isBirdsSoldFmt ? 14 : (isNew ? 12 : 9)]),
          totalEggs: parseNum(row[(isRateOfLayAdded || isBirdsSoldFmt) ? 15 : (isNew ? 13 : 10)]),
          freshEggsSold: (isRateOfLayAdded || isBirdsSoldFmt) ? parseNum(row[16]) : (isDoubleStockFmt || isProfitFmt || isNewest ? parseNum(row[14]) : 0),
          checkedEggsSold: (isRateOfLayAdded || isBirdsSoldFmt) ? parseNum(row[17]) : (isDoubleStockFmt || isProfitFmt || isNewest ? parseNum(row[15]) : 0),
          eggsSold: isInter ? parseNum(row[14]) : ((isRateOfLayAdded || isBirdsSoldFmt || isDoubleStockFmt || isProfitFmt || isNewest) ? (parseNum(row[(isRateOfLayAdded || isBirdsSoldFmt) ? 16 : 14]) + parseNum(row[(isRateOfLayAdded || isBirdsSoldFmt) ? 17 : 15])) : 0),
          freshEggsLeftInStock: (isRateOfLayAdded || isBirdsSoldFmt) ? parseNum(row[18]) : (isDoubleStockFmt ? parseNum(row[16]) : (isProfitFmt || isNewest ? parseNum(row[16]) : (isInter ? parseNum(row[15]) : 0))),
          checkedEggsLeftInStock: (isRateOfLayAdded || isBirdsSoldFmt) ? parseNum(row[19]) : (isDoubleStockFmt ? parseNum(row[17]) : 0),
          avgWeight: parseNum(row[(isRateOfLayAdded || isBirdsSoldFmt) ? 20 : (isDoubleStockFmt ? 18 : (isProfitFmt || isNewest ? 17 : (isInter ? 16 : 11)))]),
          expenses: parseNum(row[(isRateOfLayAdded || isBirdsSoldFmt) ? 21 : (isDoubleStockFmt ? 19 : (isProfitFmt || isNewest ? 18 : (isInter ? 17 : 12)))]),
          revenue: parseNum(row[(isRateOfLayAdded || isBirdsSoldFmt) ? 22 : (isDoubleStockFmt ? 20 : (isProfitFmt || isNewest ? 19 : (isInter ? 18 : 13)))]),
          rateOfLay: isRateOfLayAdded ? parseNum(row[24]) : 0,
          notes: row[isRateOfLayAdded ? 25 : (isBirdsSoldFmt ? 24 : (isDoubleStockFmt ? 22 : (isProfitFmt ? 21 : (isNewest ? 20 : (isInter ? 19 : 14)))))] ?? '',
          submittedBy: row[isRateOfLayAdded ? 26 : (isBirdsSoldFmt ? 25 : (isDoubleStockFmt ? 23 : (isProfitFmt ? 22 : (isNewest ? 21 : (isInter ? 20 : 15)))))] ?? '',
          timestamp: row[isRateOfLayAdded ? 27 : (isBirdsSoldFmt ? 26 : (isDoubleStockFmt ? 24 : (isProfitFmt ? 23 : (isNewest ? 22 : (isInter ? 21 : 16)))))] ?? '',
        };
      })
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

    return NextResponse.json({ success: true, data: recent });
  } catch (error: unknown) {
    console.error('API Error in egg-farm/route.ts [GET]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
