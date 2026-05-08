import { NextResponse } from 'next/server';
import { getRows } from '../../../../lib/sheets';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (err) {
    console.warn("Firebase Admin failed to initialize during static generation:", err);
  }
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
  'Broiler Farm': 'broiler-farm',
  'butcher': 'butcher',
};

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const token = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    const userEmail = token.email?.toLowerCase();
    const isAuthorized = userEmail && (
      userEmail === 'admin@muveste.com' ||
      userEmail === 'finance@muveste.com'
    );
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dept = searchParams.get('dept');
    const date = searchParams.get('date'); // optional — if provided, return structured detail
    const location = searchParams.get('location'); // optional

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

      // Find today's row (match by date string prefix)
      const todayRow = dataRows.find(r => {
        if (!r[0]?.startsWith(date)) return false;
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
