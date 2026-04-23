import { NextResponse } from 'next/server';
import { getRows } from '../../../../lib/sheets';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function parseNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

const SHEET_COLS: Record<string, { rev: number; exp: number }> = {
  'egg-farm': { rev: 13, exp: 12 },
  'broiler-farm': { rev: 14, exp: 13 },
  'egg-kiosk': { rev: 7, exp: 6 },
  'butcher': { rev: 7, exp: 6 },
};

// Helper to handle mixed date formats (ISO vs human readable) reliably
function normalizeDate(val: unknown): string {
  if (!val) return '';
  const s = String(val).trim();
  if (!s) return '';
  // If already ISO YYYY-MM-DD, just return it
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  
  // Return YYYY-MM-DD in local-safe way
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getDepartmentTotals(sheetName: string, targetDate: string) {
  try {
    const rows = await getRows(sheetName);
    if (!rows || rows.length <= 1) return { revenue: 0, expenses: 0, rows: [] };
    const dataRows = rows.slice(1);
    let rev = 0;
    let exp = 0;
    const normalizedTarget = normalizeDate(targetDate);
    
    const dayRows = dataRows.filter(r => normalizeDate(r[0]) === normalizedTarget);

    for (const row of dayRows) {
      if (sheetName === 'egg-farm') {
        const isBirdsSoldFmt = row.length >= 27;
        const isDoubleStockFmt = row.length === 26 || row.length === 25;
        const isProfitFmt = row.length === 24;
        const isNewest = row.length === 23;
        const isInter = row.length === 22;
        rev += parseNum(row[isBirdsSoldFmt ? 22 : (isDoubleStockFmt ? 20 : (isProfitFmt ? 19 : (isNewest ? 19 : (isInter ? 18 : 13))))]);
        exp += parseNum(row[isBirdsSoldFmt ? 21 : (isDoubleStockFmt ? 19 : (isProfitFmt ? 18 : (isNewest ? 18 : (isInter ? 17 : 12))))]);
      } else {
        rev += parseNum(row[SHEET_COLS[sheetName].rev]);
        exp += parseNum(row[SHEET_COLS[sheetName].exp]);
      }
    }
    
    return { revenue: rev, expenses: exp, rows: dayRows };
  } catch (error) {
    console.warn(`Failed to fetch ${sheetName}:`, error);
    return { revenue: 0, expenses: 0, rows: [] };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    if (!date) return NextResponse.json({ success: false, data: [] });

    const rows = await getRows('finance-expenses');
    const normalizedTarget = normalizeDate(date);
    // Row 0 is header. Match date in row[0].
    const todayRows = rows.slice(1).filter(row => normalizeDate(row[0]) === normalizedTarget);

    return NextResponse.json({ success: true, data: todayRows });
  } catch (error) {
    console.error('GET expenses error:', error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userEmail = decodedToken.email;
    if (!userEmail || (userEmail.toLowerCase() !== 'finance@30plus.rw' && userEmail.toLowerCase() !== 'admin@30plus.rw')) {
      return NextResponse.json({ error: 'Forbidden: Finance access required' }, { status: 403 });
    }

    const body = await request.json();
    const { date, bizExpenses, financeExtras } = body;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const authClient = getAuth();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // 1. Rewrite finance-expenses (Detail Log) with "Delete Today First" strategy
    const currentDetailRows = await getRows('finance-expenses');
    const detailHeader = currentDetailRows[0] || ['Date', 'Name', 'Department', 'Amount', 'By', 'Timestamp'];
    const filteredDetailRows = currentDetailRows.slice(1).filter(r => r[0] !== date);

    const newDetailRows: string[][] = [];
    const timestamp = new Date().toISOString();

    // Add ONLY the individual business expenses to the detail log.
    // We do NOT add aggregated financeExtras here anymore because they are redundant 
    // with the bizExpenses items and would cause doubling in performance reports.
    if (bizExpenses && Array.isArray(bizExpenses)) {
      bizExpenses.forEach((exp: any) => {
        if (exp.name && exp.amount) {
          const deptStr = Array.isArray(exp.department) ? exp.department.join(', ') : (exp.department || '');
          newDetailRows.push([date, exp.name, deptStr, exp.amount.toString(), userEmail, timestamp]);
        }
      });
    }

    // Rewrite finance-expenses
    await sheets.spreadsheets.values.clear({ spreadsheetId: process.env.GOOGLE_SHEETS_ID as string, range: 'finance-expenses' });
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID as string,
      range: 'finance-expenses!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [detailHeader, ...newDetailRows, ...filteredDetailRows]
      }
    });

    console.log(`[API] finance-expenses updated for ${date}. Proceeding to summary sync.`);

    // 2. Fetch today's department totals to calculate updated finance-summary row
    const [eggFarm, broiler, eggKiosk, butcher, batchesData] = await Promise.all([
      getDepartmentTotals('egg-farm', date),
      getDepartmentTotals('broiler-farm', date),
      getDepartmentTotals('egg-kiosk', date),
      getDepartmentTotals('butcher', date),
      getRows('broiler-batches'),
    ]);

    // Get all batch names for mapping
    const allBatchNames = (batchesData || []).slice(1).map((r: string[]) => r[0]).filter(Boolean);

    const efExtra = parseNum(financeExtras?.['Egg Farm']);
    const bfExtra = parseNum(financeExtras?.['Broiler Farm']);
    const batExtra = parseNum(financeExtras?.['Kiosk Batsinda']);
    const nyaExtra = parseNum(financeExtras?.['Kiosk Nyabugogo']);
    const buExtra = parseNum(financeExtras?.['Butchery']);

    // Collect per-batch extras
    let totalBatchExtras = 0;
    for (const bname of allBatchNames) {
      totalBatchExtras += parseNum(financeExtras?.[`Broiler \u2014 ${bname}`]);
    }

    const efRev = parseNum(eggFarm.revenue); 
    const efExp = parseNum(eggFarm.expenses) + efExtra;
    const efProf = efRev - efExp;

    const bfRev = parseNum(broiler.revenue); 
    const bfExp = parseNum(broiler.expenses) + bfExtra + totalBatchExtras;
    const bfProf = bfRev - bfExp;

    // Specific kiosk breakdown
    const kRows = eggKiosk.rows || [];
    const batRow = kRows.find(r => r[1] === 'Batsinda, Kigali' || (r[1] && String(r[1]).includes('Batsinda')));
    const nyaRow = kRows.find(r => r[1] === 'Nyabugogo, Kigali' || (r[1] && String(r[1]).includes('Nyabugogo')));

    const batRev = batRow ? parseNum(batRow[7]) : 0;
    const batExp = (batRow ? parseNum(batRow[6]) : 0) + batExtra;
    const batProf = batRev - batExp;

    const nyaRev = nyaRow ? parseNum(nyaRow[7]) : 0;
    const nyaExp = (nyaRow ? parseNum(nyaRow[6]) : 0) + nyaExtra;
    const nyaProf = nyaRev - nyaExp;

    const buRev = parseNum(butcher.revenue); 
    const buExp = parseNum(butcher.expenses) + buExtra;
    const buProf = buRev - buExp;

    const totalRev = efRev + bfRev + batRev + nyaRev + buRev;
    const totalExp = efExp + bfExp + batExp + nyaExp + buExp;
    const netProf = totalRev - totalExp;

    const summaryRow = [
      date,
      efRev, efExp, efProf,
      bfRev, bfExp, bfProf,
      batRev, batExp, batProf,
      nyaRev, nyaExp, nyaProf,
      buRev, buExp, buProf,
      totalRev, totalExp, netProf,
      timestamp
    ];

    // 3. Rewrite finance-summary (Daily Aggregate) with "Delete Today First" strategy
    const currentSummaryRows = await getRows('finance-summary');
    const summaryHeader = currentSummaryRows[0] || [];
    const filteredSummaryRows = currentSummaryRows.slice(1).filter(r => r[0] !== date);

    // Rewrite finance-summary
    await sheets.spreadsheets.values.clear({ spreadsheetId: process.env.GOOGLE_SHEETS_ID as string, range: 'finance-summary' });
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID as string,
      range: 'finance-summary!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [summaryHeader, summaryRow, ...filteredSummaryRows]
      }
    });

    console.log(`[API] finance-summary synced successfully for ${date}.`);

    return NextResponse.json({ 
      success: true, 
      netProfit: netProf, 
      message: 'Daily expenses saved and summary updated successfully' 
    }, { status: 200 });
  } catch (error: any) {
    console.error('API Error in finance/expenses [POST]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
