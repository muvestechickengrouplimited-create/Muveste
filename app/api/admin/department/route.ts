import { NextResponse } from 'next/server';
import { getRows } from '../../../../lib/sheets';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
    }),
  });
}
function parseNum(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const n = Number(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

// Maps dept display name → sheet tab name
const DEPT_MAP: Record<string, string> = {
  'Egg Farm': 'egg-farm',
  'Broiler Farm': 'broiler-farm',
  'Egg Kiosk': 'egg-kiosk',
  'butcher': 'butcher',
};

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const token = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    const userEmail = token.email?.toLowerCase();
    if (userEmail !== 'admin@30plus.rw' && userEmail !== 'finance@30plus.rw') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dept = searchParams.get('dept');
    const date = searchParams.get('date'); // optional — if provided, return structured detail
    const location = searchParams.get('location'); // optional — for egg-kiosk: 'Batsinda' | 'Nyabugogo'

    if (!dept) return NextResponse.json({ success: false, error: 'Missing department string' }, { status: 400 });

    // Resolve sheet tab name: accept either display name or tab name
    const sheetName = DEPT_MAP[dept] || dept;

    const rows = await getRows(sheetName);
    if (!rows || rows.length === 0) {
      // If date param was provided, return structured "no data" response
      if (date) {
        return NextResponse.json({
          department: dept,
          date,
          fields: [],
          medications: null,
          revenue: 0,
          expenses: 0,
          profit: 0,
          notes: null,
          noReport: true,
        });
      }
      return NextResponse.json({ success: true, headers: [], data: [] });
    }

    // === STRUCTURED DETAIL MODE (when ?date= is provided) ===
    if (date) {
      const headers = rows[0].map(String);
      const dataRows = rows.slice(1);

      // Find today's row (match by date string prefix, applying location filter for egg-kiosk)
      const todayRow = dataRows.find(r => {
        if (!r[0]?.startsWith(date)) return false;
        if (location && sheetName === 'egg-kiosk') {
          return String(r[1] || '').includes(location);
        }
        return true;
      });

      if (!todayRow) {
        return NextResponse.json({
          department: dept,
          date,
          fields: [],
          medications: null,
          revenue: 0,
          expenses: 0,
          profit: 0,
          notes: null,
          noReport: true,
        });
      }

      // Build structured response based on department
      const resolvedName = Object.keys(DEPT_MAP).find(k => DEPT_MAP[k] === sheetName) || dept;

      if (sheetName === 'egg-farm') {
        const isBirdsSoldFmt = todayRow.length >= 27;
        const isDoubleStockFmt = todayRow.length === 26 || todayRow.length === 25;
        const isProfitFmt = todayRow.length === 24;
        const isNewest = todayRow.length === 23;
        const isInter = todayRow.length === 22;
        const isNew = isBirdsSoldFmt || isDoubleStockFmt || isProfitFmt || isNewest || isInter;

        const totalEggsParam = parseNum(todayRow[isBirdsSoldFmt ? 15 : (isNew ? 13 : 10)]);
        const revParam = parseNum(todayRow[isBirdsSoldFmt ? 22 : (isDoubleStockFmt ? 20 : (isProfitFmt ? 19 : (isNewest ? 19 : (isInter ? 18 : 13))))]);
        const expParam = parseNum(todayRow[isBirdsSoldFmt ? 21 : (isDoubleStockFmt ? 19 : (isProfitFmt ? 18 : (isNewest ? 18 : (isInter ? 17 : 12))))]);
        const profitParam = parseNum(todayRow[isBirdsSoldFmt ? 23 : (isDoubleStockFmt ? 21 : (isProfitFmt ? 20 : (isNewest ? 19 : (isInter ? 18 : 13))))]) || (revParam - expParam);
        const notesParam = todayRow[isBirdsSoldFmt ? 24 : (isDoubleStockFmt ? 22 : (isProfitFmt ? 21 : (isNewest ? 20 : (isInter ? 19 : 14))))];
        const medParam = todayRow[4];

        const displayFields = [
            { label: 'Feed qty', value: `${parseNum(todayRow[1]).toLocaleString()} kg` },
            { label: 'Water consumed', value: `${parseNum(todayRow[3]).toLocaleString()} L` },
            { label: 'Live birds', value: isNew ? parseNum(todayRow[isBirdsSoldFmt ? 9 : 7]).toLocaleString() : 'N/A' },
            { label: 'Total eggs', value: totalEggsParam.toLocaleString() },
        ];

        if (isBirdsSoldFmt) {
            displayFields.push({ label: 'Birds sold', value: parseNum(todayRow[6]).toLocaleString() });
            displayFields.push({ label: 'Price per bird', value: `RWF ${parseNum(todayRow[7]).toLocaleString()}` });
        }

        return NextResponse.json({
          department: resolvedName,
          date,
          fields: displayFields,
          medications: medParam || null,
          revenue: revParam,
          expenses: expParam,
          profit: profitParam,
          notes: notesParam || null,
        });
      }

      if (sheetName === 'broiler-farm') {
        // Cols: Date(0), Feed Qty(1), Feed Price(2), Water(3), Medications(4), Birds(5), Mortality(6)
        //       Birds Sold(7), Live Birds(8), Avg Weight(9), Kgs Sold(10), Total Weight(11), 
        //       Price/kg(12), Expenses(13), Revenue(14), Profit(15), Notes(16), Submitted By(17), Timestamp(18)
        return NextResponse.json({
          department: resolvedName,
          date,
          fields: [
            { label: 'Feed qty', value: `${parseNum(todayRow[1]).toLocaleString()} kg` },
            { label: 'Water consumed', value: `${parseNum(todayRow[3]).toLocaleString()} L` },
            { label: 'Number of birds', value: parseNum(todayRow[5]).toLocaleString() },
            { label: 'Mortality', value: parseNum(todayRow[6]).toLocaleString() },
            { label: 'Avg weight', value: `${parseNum(todayRow[9]).toLocaleString()} kg` },
            { label: 'Total weight', value: `${parseNum(todayRow[11]).toLocaleString()} kg` },
            { label: 'Price per kg', value: `RWF ${parseNum(todayRow[12]).toLocaleString()}` },
          ],
          medications: todayRow[4] || null,
          revenue: parseNum(todayRow[14]),
          expenses: parseNum(todayRow[13]),
          profit: parseNum(todayRow[15]),
          notes: todayRow[16] || null,
        });
      }

      if (sheetName === 'egg-kiosk') {
        // [date(0), location(1), traysRec(2), traysSold(3), price(4), damaged(5), expenses(6), totalSales(7), traysLeft(8), profit(9), notes(10), financeExp(11), by(12), ts(13)]
        return NextResponse.json({
          department: resolvedName,
          date,
          fields: [
            { label: 'Trays received', value: parseNum(todayRow[2]).toLocaleString() },
            { label: 'Trays sold', value: parseNum(todayRow[3]).toLocaleString() },
            { label: 'Price per tray', value: `RWF ${parseNum(todayRow[4]).toLocaleString()}` },
            { label: 'Damaged trays', value: parseNum(todayRow[5]).toLocaleString() },
            { label: 'Trays left', value: parseNum(todayRow[8]).toLocaleString() },
          ],
          medications: null,
          revenue: parseNum(todayRow[7]),
          expenses: parseNum(todayRow[6]),
          profit: parseNum(todayRow[9]),
          notes: todayRow[10] || null,
        });
      }

      if (sheetName === 'butcher') {
        // [date(0), meatRec(1), meatSold(2), priceKg(3), damaged(4), stockLeft(5), expenses(6), totalSales(7), profit(8), notes(9), by(10), ts(11)]
        return NextResponse.json({
          department: resolvedName,
          date,
          fields: [
            { label: 'Meat received', value: `${parseNum(todayRow[1]).toLocaleString()} kg` },
            { label: 'Meat sold', value: `${parseNum(todayRow[2]).toLocaleString()} kg` },
            { label: 'Price per kg', value: `RWF ${parseNum(todayRow[3]).toLocaleString()}` },
            { label: 'Stock left', value: `${parseNum(todayRow[5]).toLocaleString()} kg` },
          ],
          medications: null,
          revenue: parseNum(todayRow[7]),
          expenses: parseNum(todayRow[6]),
          profit: parseNum(todayRow[8]),
          notes: todayRow[9] || null,
        });
      }
    }

    // === RAW TABLE MODE (original behavior — used by admin/broiler/page.tsx etc.) ===
    const headers = rows[0].map(String);
    let data = rows.slice(1);

    // Sort newest first (assuming Date is col 0)
    data.sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

    return NextResponse.json({ success: true, headers, data });
  } catch (error) {
    console.error('API Admin Department Error:', error);
    return NextResponse.json({ success: false, error: `Internal Server Error: ${(error as any).message}` }, { status: 500 });
  }
}
