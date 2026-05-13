import { NextResponse } from 'next/server';
import { prependRow, getRows } from '../../../lib/sheets';
import { formatDate, formatTime } from '../../../lib/utils';
import admin from '../../../lib/firebase-admin';
import { google } from 'googleapis';

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

// ─── GET — Fetch data ──────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const period = searchParams.get('period');
    const monthStr = searchParams.get('month');

    // Always load broiler-farm and broiler-batches to know all batch names
    const [bfAllRows, batchRows] = await Promise.all([
      getRows('broiler-farm'),
      getRows('broiler-batches'),
    ]);

    const bfData = (bfAllRows || []).slice(1);
    // batch names from the broiler-batches sheet (col 0 = name)
    const allBatchNames: string[] = (batchRows || [])
      .slice(1)
      .map((r: string[]) => r[0])
      .filter(Boolean);

    // Utility: sum broiler revenue+expenses by batch for a set of rows
    const batchTotals = (rows: string[][]) => {
      const out: Record<string, { rev: number; exp: number }> = {};
      for (const name of allBatchNames) out[name] = { rev: 0, exp: 0 };
      for (const r of rows) {
        const batch = r[1]; // col 1 = batch name
        if (out[batch] !== undefined) {
          out[batch].rev += parseNum(r[15]); // col 15 = revenue
          out[batch].exp += parseNum(r[14]); // col 14 = expenses
        }
      }
      return out;
    };

    // ── 1. Daily date pull ────────────────────────────────────────────────
    if (date) {
      const normalizedDate = normalizeDate(date);

      const [bkAllRows, brAllRows, bnAllRows, finExpAllRows] = await Promise.all([
        getRows('butcher-kibungo'),
        getRows('butcher-rwamagana'),
        getRows('butcher-nyabugogo'),
        getRows('finance-expenses'),
      ]);

      const bkData = (bkAllRows || []).slice(1);
      const brData = (brAllRows || []).slice(1);
      const bnData = (bnAllRows || []).slice(1);
      const finExpData = (finExpAllRows || []).slice(1);

      // Broiler — per batch
      const bfDayRows = bfData.filter(r => normalizeDate(r[0]) === normalizedDate);
      const broilerByBatch = batchTotals(bfDayRows);

      // Butcher
      const bkDayRows = bkData.filter(r => normalizeDate(r[0]) === normalizedDate);
      const brDayRows = brData.filter(r => normalizeDate(r[0]) === normalizedDate);
      const bnDayRows = bnData.filter(r => normalizeDate(r[0]) === normalizedDate);
      let bkRev = 0, bkExp = 0, brRev = 0, brExp = 0, bnRev = 0, bnExp = 0;
      for (const r of bkDayRows) { bkRev += parseNum(r[8]); bkExp += (parseNum(r[3]) + parseNum(r[7])); }
      for (const r of brDayRows) { brRev += parseNum(r[8]); brExp += (parseNum(r[3]) + parseNum(r[7])); }
      for (const r of bnDayRows) { bnRev += parseNum(r[8]); bnExp += (parseNum(r[3]) + parseNum(r[7])); }
      const buRev = bkRev + brRev + bnRev;
      const buExp = bkExp + brExp + bnExp;

      // Finance extras
      const dayFinExps = finExpData.filter(r => normalizeDate(r[0]) === normalizedDate);
      const dayExtras: Record<string, number> = { bk: 0, br: 0, bn: 0, bf: 0 };
      // Per-batch extras (keyed by batch name)
      const batchExtras: Record<string, number> = {};
      for (const name of allBatchNames) batchExtras[name] = 0;

      // Build dynamic DEPT_KEY_MAP that includes per-batch entries
      const DEPT_KEY_MAP: Record<string, string> = {
        'broiler farm': 'bf',
        'butchery kibungo': 'bk', 'butchery - kibungo': 'bk', 'butchery — kibungo': 'bk',
        'butchery rwamagana': 'br', 'butchery - rwamagana': 'br', 'butchery — rwamagana': 'br',
        'butchery nyabugogo': 'bn', 'butchery - nyabugogo': 'bn', 'butchery — nyabugogo': 'bn',
      };
      // Add per-batch mappings: "broiler — batch a" → batch key
      for (const name of allBatchNames) {
        DEPT_KEY_MAP[`broiler — ${name}`.toLowerCase()] = `batch_${name}`;
        DEPT_KEY_MAP[`broiler - ${name}`.toLowerCase()] = `batch_${name}`;
      }

      for (const r of dayFinExps) {
        const amount = parseNum(r[3]);
        const depts = String(r[2] || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (depts.length > 0 && amount !== 0) {
          const share = amount / depts.length;
          for (const dept of depts) {
            const key = DEPT_KEY_MAP[dept];
            if (!key) continue;
            if (key.startsWith('batch_')) {
              const batchName = key.replace('batch_', '');
              batchExtras[batchName] = (batchExtras[batchName] || 0) + share;
            } else {
              dayExtras[key] = (dayExtras[key] || 0) + share;
            }
          }
        }
      }

      // Build tracker (one entry per batch + other depts)
      // NOTE: tracker values contain ONLY base dept expenses (no finance extras)
      // so the frontend can display and sum them separately without double-counting.
      const tracker: Record<string, { value: number; submitted: boolean }> = {
        'Butchery Kibungo': { value: bkExp, submitted: bkDayRows.length > 0 },
        'Butchery Rwamagana': { value: brExp, submitted: brDayRows.length > 0 },
        'Butchery Nyabugogo': { value: bnExp, submitted: bnDayRows.length > 0 },
      };

      // Build data object (flat broiler-farm total kept for backwards compat)
      let bfTotalRev = 0, bfTotalExp = 0;
      const batchData: Record<string, { revenue: number; expenses: number }> = {};
      for (const [bname, vals] of Object.entries(broilerByBatch)) {
        const bExtra = batchExtras[bname] || 0;
        bfTotalRev += vals.rev;
        bfTotalExp += vals.exp + bExtra;
        batchData[`broiler_${bname}`] = { revenue: vals.rev, expenses: vals.exp + bExtra };
        // Store ONLY base batch expense in tracker (finance extras handled by frontend financeExtras state)
        tracker[`Broiler — ${bname}`] = {
          value: vals.exp,
          submitted: bfDayRows.some(r => r[1] === bname),
        };
      }

      const totalRevenue = bfTotalRev + buRev;
      const totalExpenses = bfTotalExp + (bkExp + dayExtras.bk) + (brExp + dayExtras.br) + (bnExp + dayExtras.bn);

      return NextResponse.json({
        date: normalizedDate,
        batches: allBatchNames,
        data: {
          broilerRevenue: bfTotalRev,
          broilerExpenses: bfTotalExp + dayExtras.bf,
          butcherRevenue: buRev,
          butcherExpenses: buExp + (dayExtras.bk + dayExtras.br + dayExtras.bn),
          kibungoRevenue: bkRev, kibungoExpenses: bkExp + dayExtras.bk,
          rwamaganaRevenue: brRev, rwamaganaExpenses: brExp + dayExtras.br,
          nyabugogoRevenue: bnRev, nyabugogoExpenses: bnExp + dayExtras.bn,
          ...batchData,
        },
        tracker,
        totals: { totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses },
      });
    }

    // ── 2. All / monthly records ──────────────────────────────────────────
    const [bkAllRows, brAllRows, bnAllRows, finExpAllRows] = await Promise.all([
      getRows('butcher-kibungo'),
      getRows('butcher-rwamagana'),
      getRows('butcher-nyabugogo'),
      getRows('finance-expenses'),
    ]);

    const bkData = (bkAllRows || []).slice(1);
    const brData = (brAllRows || []).slice(1);
    const bnData = (bnAllRows || []).slice(1);
    const finExpData = (finExpAllRows || []).slice(1);

    // Collect all unique dates
    const allDates = new Set<string>();
    for (const r of bfData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }
    for (const r of bkData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }
    for (const r of brData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }
    for (const r of bnData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }
    for (const r of finExpData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }

    // Build dynamic DEPT_KEY_MAP including per-batch entries
    const DEPT_KEY_MAP: Record<string, string> = {
      'broiler farm': 'bf',
      'butchery kibungo': 'bk', 'butchery - kibungo': 'bk', 'butchery — kibungo': 'bk',
        'butchery rwamagana': 'br', 'butchery - rwamagana': 'br', 'butchery — rwamagana': 'br',
        'butchery nyabugogo': 'bn', 'butchery - nyabugogo': 'bn', 'butchery — nyabugogo': 'bn',
    };
    for (const name of allBatchNames) {
      DEPT_KEY_MAP[`broiler — ${name}`.toLowerCase()] = `batch_${name}`;
      DEPT_KEY_MAP[`broiler - ${name}`.toLowerCase()] = `batch_${name}`;
    }

    const finExtrasPerDate: Record<string, Record<string, number>> = {};
    for (const r of finExpData) {
      const d = normalizeDate(r[0]);
      if (!d) continue;
      const amount = parseNum(r[3]);
      if (amount === 0) continue;
      const depts = String(r[2] || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (depts.length === 0) continue;
      const share = amount / depts.length;
      if (!finExtrasPerDate[d]) finExtrasPerDate[d] = { bf: 0, bk: 0, br: 0, bn: 0 };
      for (const deptLabel of depts) {
        const key = DEPT_KEY_MAP[deptLabel];
        if (!key) continue;
        finExtrasPerDate[d][key] = (finExtrasPerDate[d][key] || 0) + share;
      }
    }

    // Build a record for each date — now includes per-batch broiler data
    const buildRecord = (dateStr: string) => {
      // Broiler — per batch
      const bfRows = bfData.filter(r => normalizeDate(r[0]) === dateStr);
      const broilerByBatch = batchTotals(bfRows);
      let bfTotalRev = 0, bfTotalExp = 0;
      const batchFields: Record<string, number> = {};
      const extras = finExtrasPerDate[dateStr] || {};
      for (const [bname, vals] of Object.entries(broilerByBatch)) {
        const bExtra = extras[`batch_${bname}`] || 0;
        bfTotalRev += vals.rev;
        bfTotalExp += vals.exp + bExtra;
        batchFields[`broiler_${bname}_revenue`] = vals.rev;
        batchFields[`broiler_${bname}_expenses`] = vals.exp + bExtra;
        batchFields[`broiler_${bname}_profit`] = vals.rev - (vals.exp + bExtra);
      }

      // Butcher
      const bkRows = bkData.filter(r => normalizeDate(r[0]) === dateStr);
      const brRows = brData.filter(r => normalizeDate(r[0]) === dateStr);
      const bnRows = bnData.filter(r => normalizeDate(r[0]) === dateStr);
      let bkRev = 0, bkExp = 0, brRev = 0, brExp = 0, bnRev = 0, bnExp = 0;
      for (const r of bkRows) { bkRev += parseNum(r[8]); bkExp += (parseNum(r[3]) + parseNum(r[7])); }
      for (const r of brRows) { brRev += parseNum(r[8]); brExp += (parseNum(r[3]) + parseNum(r[7])); }
      for (const r of bnRows) { bnRev += parseNum(r[8]); bnExp += (parseNum(r[3]) + parseNum(r[7])); }
      const buRev = bkRev + brRev + bnRev;
      let buExp = bkExp + brExp + bnExp;

      // Finance extras (non-batch)
      bfTotalExp += extras.bf || 0;
      buExp += (extras.bk || 0) + (extras.br || 0) + (extras.bn || 0);

      const bfProf = bfTotalRev - bfTotalExp;
      const buProf = buRev - buExp;

      const tRev = bfTotalRev + buRev;
      const tExp = bfTotalExp + buExp;

      return {
        date: dateStr,
        broilerRevenue: bfTotalRev, broilerExpenses: bfTotalExp, broilerProfit: bfProf,
        kibungoRevenue: bkRev, kibungoExpenses: bkExp, kibungoProfit: bkRev - bkExp,
        rwamaganaRevenue: brRev, rwamaganaExpenses: brExp, rwamaganaProfit: brRev - brExp,
        nyabugogoRevenue: bnRev, nyabugogoExpenses: bnExp, nyabugogoProfit: bnRev - bnExp,
        totalRevenue: tRev, totalExpenses: tExp, netProfit: tRev - tExp,
        timestamp: '',
        ...batchFields,
      };
    };

    if (period === 'monthly' && monthStr) {
      const monthDates = Array.from(allDates).filter(d => d.startsWith(monthStr));
      const records = monthDates.map(buildRecord);
      const totalRev = records.reduce((s, r) => s + r.totalRevenue, 0);
      const totalExp = records.reduce((s, r) => s + r.totalExpenses, 0);
      const netProf = records.reduce((s, r) => s + r.netProfit, 0);

      return NextResponse.json({
        monthlyRevenue: totalRev,
        monthlyExpenses: totalExp,
        monthlyProfit: netProf,
        daysRecorded: records.length,
        batches: allBatchNames,
        records: records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      });
    }

    const allRecords = Array.from(allDates).map(buildRecord)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ success: true, batches: allBatchNames, data: allRecords });

  } catch (error) {
    console.error('API Error in finance/route.ts [GET]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ─── POST — save/overwrite finance summary row (one per date) ─────────────────
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
    const {
      date,
      broilerRevenue, broilerExpenses,
      kibungoRevenue, kibungoExpenses,
      rwamaganaRevenue, rwamaganaExpenses,
      nyabugogoRevenue, nyabugogoExpenses,
    } = body;

    if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });

    const bfRev = parseNum(broilerRevenue);    const bfExp = parseNum(broilerExpenses);    const bfProf = bfRev - bfExp;
    const bkRev = parseNum(kibungoRevenue);    const bkExp = parseNum(kibungoExpenses);    const bkProf = bkRev - bkExp;
    const brRev = parseNum(rwamaganaRevenue);    const brExp = parseNum(rwamaganaExpenses);    const brProf = brRev - brExp;
    const bnRev = parseNum(nyabugogoRevenue);    const bnExp = parseNum(nyabugogoExpenses);    const bnProf = bnRev - bnExp;

    const totalRev = bfRev + bkRev + brRev + bnRev;
    const totalExp = bfExp + bkExp + brExp + bnExp;
    const netProf = totalRev - totalExp;

    const now = new Date();
    const newRow = [
      date,
      bfRev, bfExp, bfProf,
      bkRev, bkExp, bkProf,
      brRev, brExp, brProf,
      bnRev, bnExp, bnProf,
      totalRev, totalExp, netProf,
      now.toISOString(),
    ];

    // ── "Delete Today First, Then Save" strategy ─────────────────────────────
    // This ensures only ONE row per date is ever stored in finance-summary.
    const authClient = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const currentRows = await getRows('finance-summary', true); // bypass cache
    const header = currentRows[0] || [];
    // Remove any existing row for this date, then prepend the new one
    const otherRows = currentRows.slice(1).filter(r => normalizeDate(r[0]) !== normalizeDate(date));

    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID as string,
      range: 'finance-summary',
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID as string,
      range: 'finance-summary!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [header, newRow, ...otherRows],
      },
    });

    // Log to admin-log
    await prependRow('admin-log', [
      formatDate(now), formatTime(now), 'Finance',
      'Daily summary saved (upsert)', userEmail, 'Submitted', now.toISOString(),
    ]);

    return NextResponse.json({ success: true, netProfit: netProf }, { status: 200 });
  } catch (error) {
    console.error('API Error in finance/route.ts [POST]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
