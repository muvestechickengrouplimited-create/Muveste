import { NextResponse } from 'next/server';
import { getRows } from '../../../../lib/sheets';
import admin from '../../../../lib/firebase-admin';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

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
  'broiler-farm': { rev: 14, exp: 13 },
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
      rev += parseNum(row[SHEET_COLS[sheetName].rev]);
      exp += parseNum(row[SHEET_COLS[sheetName].exp]);
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

    const userEmail = decodedToken.email?.toLowerCase();
    const isAuthorized = userEmail && (
      userEmail === 'finance@muveste.com' ||
      userEmail === 'admin@muveste.com'
    );
    if (!isAuthorized) {
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
    const currentDetailRows = await getRows('finance-expenses', true); // ALWAYS bypass cache for writes
    const detailHeader = currentDetailRows[0] || ['Date', 'Name', 'Department', 'Amount', 'By', 'Timestamp'];
    const normalizedTarget = normalizeDate(date);
    const filteredDetailRows = currentDetailRows.slice(1).filter(r => normalizeDate(r[0]) !== normalizedTarget);

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

    console.log(`[API] finance-expenses updated for ${date}.`);

    return NextResponse.json({ 
      success: true, 
      message: 'Daily expenses saved successfully' 
    }, { status: 200 });
  } catch (error: any) {
    console.error('API Error in finance/expenses [POST]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
