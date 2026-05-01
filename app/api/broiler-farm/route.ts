import { NextResponse } from 'next/server';
import { prependRow, getRows, updateRow } from '../../../lib/sheets';
import { formatDate, formatTime } from '../../../lib/utils';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
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

    // Role check: Only broiler_farm or admin can submit
    const isAuthorized =
      userEmail.toLowerCase() === 'broiler@30plus.rw' ||
      userEmail.toLowerCase() === 'admin@30plus.rw';
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions for Broiler Farm' },
        { status: 403 }
      );
    }

    // 2. Parse body
    const body = await request.json();
    const {
      date,
      batch,
      feedQty,
      price, // feed price
      water,
      medications,
      numberOfBirds,
      mortality,
      birdsSold,
      avgWeight,
      pricePerKg,
      expenses,
      notes,
    } = body;

    // 3. Validate required fields
    if (
      !date ||
      !batch ||
      feedQty === undefined ||
      price === undefined ||
      water === undefined ||
      numberOfBirds === undefined ||
      mortality === undefined ||
      avgWeight === undefined ||
      pricePerKg === undefined
    ) {
      return NextResponse.json(
        { error: 'Bad Request: Missing required data fields' },
        { status: 400 }
      );
    }

    // 4. Server-side calculations (authoritative)
    const lBirdsSold = parseNum(birdsSold);
    const lAvgWeight = parseNum(avgWeight);
    const lPricePerKg = parseNum(pricePerKg);
    const lExpenses = parseNum(expenses);
    
    const liveBirds = parseNum(numberOfBirds) - parseNum(mortality) - lBirdsSold;
    const kgsSold = lBirdsSold * lAvgWeight;
    const totalWeight = liveBirds * lAvgWeight;
    const revenue = kgsSold * lPricePerKg;
    const profit = revenue - lExpenses;
    const now = new Date();
    
    // 5. Row order must match sheet headers exactly (20 columns):
    // 0:Date, 1:Batch, 2:Feed Qty, 3:Price (Feed), 4:Water, 5:Medications, 
    // 6:Number of Birds, 7:Mortality, 8:Birds Sold, 9:Live Birds, 
    // 10:Avg Weight, 11:Kgs Sold, 12:Total Weight, 13:Price Per kg, 
    // 14:Expenses, 15:Revenue, 16:Profit, 17:Notes, 18:Submitted By, 19:Timestamp
    const rowData = [
      date,
      batch,
      parseNum(feedQty),
      parseNum(price),
      parseNum(water),
      medications || '',
      parseNum(numberOfBirds),
      parseNum(mortality),
      lBirdsSold,
      liveBirds,
      lAvgWeight,
      kgsSold,
      totalWeight,
      lPricePerKg,
      lExpenses,
      revenue,
      profit,
      notes || '',
      userEmail,
      now.toISOString(),
    ];

    const existingRows = await getRows('broiler-farm', true); // Bypass cache for precise check
    let existingRowIndex = -1;
    
    if (existingRows && existingRows.length > 1) {
      // Find row with same date and batch
      // index 0 is header, so start from 1
      for (let i = 1; i < existingRows.length; i++) {
        if (existingRows[i][0] === date && existingRows[i][1] === batch) {
          existingRowIndex = i + 1; // Google Sheets is 1-indexed
          break;
        }
      }
    }

    if (existingRowIndex !== -1) {
      await updateRow('broiler-farm', existingRowIndex, rowData);
    } else {
      await prependRow('broiler-farm', rowData);
    }

    // 6. Log to admin-log tab
    await prependRow('admin-log', [
      formatDate(now),
      formatTime(now),
      'Broiler Farm',
      existingRowIndex !== -1 
        ? `Daily report updated (${batch} - ${date})`
        : `Daily report submitted (${batch} - ${date})`,
      userEmail,
      existingRowIndex !== -1 ? 'Updated' : 'Submitted',
      now.toISOString(),
    ]);

    return NextResponse.json({ 
      success: true, 
      totalWeight, 
      revenue, 
      profit, 
      updated: existingRowIndex !== -1 
    }, { status: existingRowIndex !== -1 ? 200 : 201 });
  } catch (error: unknown) {
    console.error('API Error in broiler-farm/route.ts [POST]:', error);
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
    const batch = searchParams.get('batch');
    const last = searchParams.get('last');
    const date = searchParams.get('date');

    // Fetch all rows
    const rows = await getRows('broiler-farm');

    if (batch && last === '1') {
      const dataRows = (rows && rows.length > 1) ? rows.slice(1) : [];
      const batchRows = dataRows.filter(r => r[1] === batch);
      const lastRow = batchRows[0]; // newest first due to prepend
      return NextResponse.json({
        liveBirds: parseInt(lastRow?.[9]) || 0 // Live Birds is at index 9 now
      });
    }

    if (batch && date) {
      const dataRows = (rows && rows.length > 1) ? rows.slice(1) : [];
      const match = dataRows.find(r => r[0] === date && r[1] === batch);
      if (match) {
        return NextResponse.json({
          success: true,
          data: {
            date:             match[0],
            batch:            match[1],
            feedQty:          match[2],
            price:            match[3],
            water:            match[4],
            medications:      match[5],
            numberOfBirds:    match[6],
            mortality:        match[7],
            birdsSold:        match[8],
            liveBirds:        match[9],
            avgWeight:        match[10],
            kgsSold:          match[11],
            totalWeight:      match[12],
            pricePerKg:       match[13],
            expenses:         match[14],
            revenue:          match[15],
            profit:           match[16],
            notes:            match[17],
            submittedBy:      match[18],
            timestamp:        match[19],
          }
        });
      }
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    if (batch) {
      const dataRows = (rows && rows.length > 1) ? rows.slice(1) : [];
      const batchRows = dataRows.filter(r => r[1] === batch);
      return NextResponse.json({ success: true, data: batchRows });
    }

    if (last === '1') {
      const dataRows = (rows && rows.length > 1) ? rows.slice(1) : [];
      const lastRow = dataRows[0];
      if (lastRow) {
        return NextResponse.json({
          liveBirds: parseInt(lastRow[9]) || 0
        });
      }
      return NextResponse.json({ liveBirds: 0 });
    }

    if (!rows || rows.length <= 1) {
      if (period === 'monthly') {
        return NextResponse.json({
          totalBirds: 0,
          totalMortality: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
        });
      }
      return NextResponse.json([]);
    }

    const dataRows = rows.slice(1);

    const today = new Date();

    // ── Monthly totals ──────────────────────────────────────────────────
    if (period === 'monthly') {
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();

      let totalBirds = 0;
      let totalMortality = 0;
      let totalRevenue = 0;
      let totalExpenses = 0;

      for (const row of dataRows) {
        const rowDate = new Date(row[0]);
        if (
          !isNaN(rowDate.getTime()) &&
          rowDate.getMonth() === thisMonth &&
          rowDate.getFullYear() === thisYear
        ) {
          totalBirds    += parseNum(row[6]); // Num birds at 6
          totalMortality+= parseNum(row[7]); // Mortality at 7
          totalRevenue  += parseNum(row[15]); // Revenue at 15
          totalExpenses += parseNum(row[14]); // Expenses at 14
        }
      }

      return NextResponse.json({
        totalBirds,
        totalMortality,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
      });
    }

    // ── Last 30 days, sorted newest first ──────────────────────────────
    const cutoff30 = new Date(today);
    cutoff30.setDate(cutoff30.getDate() - 30);

    const recent = dataRows
      .filter((row) => {
        const rowDate = new Date(row[0]);
        return !isNaN(rowDate.getTime()) && rowDate >= cutoff30;
      })
      .map((row) => ({
        date:             row[0]  ?? '',
        batch:            row[1]  ?? '',
        feedQty:          parseNum(row[2]),
        price:            parseNum(row[3]),
        water:            parseNum(row[4]),
        medications:      row[5]  ?? '',
        numberOfBirds:    parseNum(row[6]),
        mortality:        parseNum(row[7]),
        birdsSold:        parseNum(row[8]),
        liveBirds:        parseNum(row[9]),
        avgWeight:        parseNum(row[10]),
        kgsSold:          parseNum(row[11]),
        totalWeight:      parseNum(row[12]),
        pricePerKg:       parseNum(row[13]),
        expenses:         parseNum(row[14]),
        revenue:          parseNum(row[15]),
        profit:           parseNum(row[16]),
        notes:            row[17] ?? '',
        submittedBy:      row[18] ?? '',
        timestamp:        row[19] ?? '',
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ success: true, data: recent });

  } catch (error: unknown) {
    console.error('API Error in broiler-farm/route.ts [GET]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
