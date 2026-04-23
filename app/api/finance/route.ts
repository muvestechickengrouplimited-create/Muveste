import { NextResponse } from 'next/server';
import { prependRow, getRows } from '../../../lib/sheets';
import { formatDate, formatTime } from '../../../lib/utils';
import * as admin from 'firebase-admin';

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

// Helper: get egg-farm revenue/expenses for a single row
function getEfValues(r: string[]) {
  const isBirdsSoldFmt = r.length >= 27;
  const isDoubleStockFmt = r.length === 26 || r.length === 25;
  const isProfitFmt = r.length === 24;
  const isNewest = r.length === 23;
  const isInter = r.length === 22;
  const rev = parseNum(r[isBirdsSoldFmt ? 22 : (isDoubleStockFmt ? 20 : (isProfitFmt ? 19 : (isNewest ? 19 : (isInter ? 18 : 13))))]);
  const exp = parseNum(r[isBirdsSoldFmt ? 21 : (isDoubleStockFmt ? 19 : (isProfitFmt ? 18 : (isNewest ? 18 : (isInter ? 17 : 12))))]);
  return { rev, exp };
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

      const [efAllRows, ekAllRows, buAllRows, finExpAllRows] = await Promise.all([
        getRows('egg-farm'),
        getRows('egg-kiosk'),
        getRows('butcher'),
        getRows('finance-expenses'),
      ]);

      const efData = (efAllRows || []).slice(1);
      const ekData = (ekAllRows || []).slice(1);
      const buData = (buAllRows || []).slice(1);
      const finExpData = (finExpAllRows || []).slice(1);

      // Egg Farm
      const efDayRows = efData.filter(r => normalizeDate(r[0]) === normalizedDate);
      let efRev = 0, efExp = 0;
      for (const r of efDayRows) { const v = getEfValues(r); efRev += v.rev; efExp += v.exp; }

      // Broiler — per batch
      const bfDayRows = bfData.filter(r => normalizeDate(r[0]) === normalizedDate);
      const broilerByBatch = batchTotals(bfDayRows);

      // Egg Kiosk
      const ekDayRows = ekData.filter(r => normalizeDate(r[0]) === normalizedDate);
      const batRow = ekDayRows.find(r => String(r[1] || '').includes('Batsinda'));
      const nyaRow = ekDayRows.find(r => String(r[1] || '').includes('Nyabugogo'));

      // Butcher
      const buDayRows = buData.filter(r => normalizeDate(r[0]) === normalizedDate);
      let buRev = 0, buExp = 0;
      for (const r of buDayRows) { buRev += parseNum(r[7]); buExp += parseNum(r[6]); }

      // Finance extras
      const dayFinExps = finExpData.filter(r => normalizeDate(r[0]) === normalizedDate);
      const dayExtras: Record<string, number> = { ef: 0, bu: 0, kBat: 0, kNya: 0, bf: 0 };
      // Per-batch extras (keyed by batch name)
      const batchExtras: Record<string, number> = {};
      for (const name of allBatchNames) batchExtras[name] = 0;

      // Build dynamic DEPT_KEY_MAP that includes per-batch entries
      const DEPT_KEY_MAP: Record<string, string> = {
        'egg farm': 'ef', 'broiler farm': 'bf',
        'kiosk batsinda': 'kBat', 'kiosk nyabugogo': 'kNya',
        'butchery': 'bu', 'butcher': 'bu',
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
        'Egg Farm': { value: efExp, submitted: efDayRows.length > 0 },
        'Kiosk Batsinda': { value: batRow ? parseNum(batRow[6]) : 0, submitted: !!batRow },
        'Kiosk Nyabugogo': { value: nyaRow ? parseNum(nyaRow[6]) : 0, submitted: !!nyaRow },
        'Butchery': { value: buExp, submitted: buDayRows.length > 0 },
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

      const kBatRev = batRow ? parseNum(batRow[7]) : 0;
      const kBatExp = (batRow ? parseNum(batRow[6]) : 0) + dayExtras.kBat;
      const kNyaRev = nyaRow ? parseNum(nyaRow[7]) : 0;
      const kNyaExp = (nyaRow ? parseNum(nyaRow[6]) : 0) + dayExtras.kNya;

      const totalRevenue = efRev + bfTotalRev + kBatRev + kNyaRev + buRev;
      const totalExpenses = (efExp + dayExtras.ef) + bfTotalExp + kBatExp + kNyaExp + (buExp + dayExtras.bu);

      return NextResponse.json({
        date: normalizedDate,
        batches: allBatchNames,
        data: {
          eggFarmRevenue: efRev,
          eggFarmExpenses: efExp + dayExtras.ef,
          broilerRevenue: bfTotalRev,
          broilerExpenses: bfTotalExp + dayExtras.bf,
          kioskBatsindaRevenue: kBatRev,
          kioskBatsindaExpenses: kBatExp,
          kioskNyabugogoRevenue: kNyaRev,
          kioskNyabugogoExpenses: kNyaExp,
          butcherRevenue: buRev,
          butcherExpenses: buExp + dayExtras.bu,
          ...batchData,
        },
        tracker,
        totals: { totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses },
      });
    }

    // ── 2. All / monthly records ──────────────────────────────────────────
    const [efAllRows, ekAllRows, buAllRows, finExpAllRows] = await Promise.all([
      getRows('egg-farm'),
      getRows('egg-kiosk'),
      getRows('butcher'),
      getRows('finance-expenses'),
    ]);

    const efData = (efAllRows || []).slice(1);
    const ekData = (ekAllRows || []).slice(1);
    const buData = (buAllRows || []).slice(1);
    const finExpData = (finExpAllRows || []).slice(1);

    // Collect all unique dates
    const allDates = new Set<string>();
    for (const r of efData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }
    for (const r of bfData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }
    for (const r of ekData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }
    for (const r of buData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }
    for (const r of finExpData) { const d = normalizeDate(r[0]); if (d) allDates.add(d); }

    // Build dynamic DEPT_KEY_MAP including per-batch entries
    const DEPT_KEY_MAP: Record<string, string> = {
      'egg farm': 'ef', 'broiler farm': 'bf',
      'kiosk batsinda': 'kBat', 'kiosk nyabugogo': 'kNya',
      'butchery': 'bu', 'butcher': 'bu',
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
      if (!finExtrasPerDate[d]) finExtrasPerDate[d] = { ef: 0, bf: 0, kBat: 0, kNya: 0, bu: 0 };
      for (const deptLabel of depts) {
        const key = DEPT_KEY_MAP[deptLabel];
        if (!key) continue;
        finExtrasPerDate[d][key] = (finExtrasPerDate[d][key] || 0) + share;
      }
    }

    // Build a record for each date — now includes per-batch broiler data
    const buildRecord = (dateStr: string) => {
      // Egg Farm
      const efRows = efData.filter(r => normalizeDate(r[0]) === dateStr);
      let efRev = 0, efExp = 0;
      for (const r of efRows) { const v = getEfValues(r); efRev += v.rev; efExp += v.exp; }

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

      // Egg Kiosk
      const ekRows = ekData.filter(r => normalizeDate(r[0]) === dateStr);
      let kBatRev = 0, kBatExp = 0, kNyaRev = 0, kNyaExp = 0;
      for (const r of ekRows) {
        const loc = String(r[1] || '');
        if (loc.includes('Batsinda')) { kBatRev += parseNum(r[7]); kBatExp += parseNum(r[6]); }
        else if (loc.includes('Nyabugogo')) { kNyaRev += parseNum(r[7]); kNyaExp += parseNum(r[6]); }
      }

      // Butcher
      const buRows = buData.filter(r => normalizeDate(r[0]) === dateStr);
      let buRev = 0, buExp = 0;
      for (const r of buRows) { buRev += parseNum(r[7]); buExp += parseNum(r[6]); }

      // Finance extras (non-batch)
      efExp += extras.ef || 0;
      bfTotalExp += extras.bf || 0;
      kBatExp += extras.kBat || 0;
      kNyaExp += extras.kNya || 0;
      buExp += extras.bu || 0;

      const efProf = efRev - efExp;
      const bfProf = bfTotalRev - bfTotalExp;
      const kBatProf = kBatRev - kBatExp;
      const kNyaProf = kNyaRev - kNyaExp;
      const buProf = buRev - buExp;

      const tRev = efRev + bfTotalRev + kBatRev + kNyaRev + buRev;
      const tExp = efExp + bfTotalExp + kBatExp + kNyaExp + buExp;

      return {
        date: dateStr,
        eggFarmRevenue: efRev, eggFarmExpenses: efExp, eggFarmProfit: efProf,
        broilerRevenue: bfTotalRev, broilerExpenses: bfTotalExp, broilerProfit: bfProf,
        kioskBatsindaRevenue: kBatRev, kioskBatsindaExpenses: kBatExp, kioskBatsindaProfit: kBatProf,
        kioskNyabugogoRevenue: kNyaRev, kioskNyabugogoExpenses: kNyaExp, kioskNyabugogoProfit: kNyaProf,
        butcherRevenue: buRev, butcherExpenses: buExp, butcherProfit: buProf,
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

// ─── POST — append finance summary row ─────────────────────────────────────
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
    const {
      date,
      eggFarmRevenue, eggFarmExpenses,
      broilerRevenue, broilerExpenses,
      kioskBatsindaRevenue, kioskBatsindaExpenses,
      kioskNyabugogoRevenue, kioskNyabugogoExpenses,
      butcherRevenue, butcherExpenses,
    } = body;

    if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 });

    const efRev = parseNum(eggFarmRevenue);    const efExp = parseNum(eggFarmExpenses);    const efProf = efRev - efExp;
    const bfRev = parseNum(broilerRevenue);    const bfExp = parseNum(broilerExpenses);    const bfProf = bfRev - bfExp;
    const batRev = parseNum(kioskBatsindaRevenue); const batExp = parseNum(kioskBatsindaExpenses); const batProf = batRev - batExp;
    const nyaRev = parseNum(kioskNyabugogoRevenue); const nyaExp = parseNum(kioskNyabugogoExpenses); const nyaProf = nyaRev - nyaExp;
    const buRev = parseNum(butcherRevenue);    const buExp = parseNum(butcherExpenses);    const buProf = buRev - buExp;

    const totalRev = efRev + bfRev + batRev + nyaRev + buRev;
    const totalExp = efExp + bfExp + batExp + nyaExp + buExp;
    const netProf = totalRev - totalExp;

    const now = new Date();
    const rowData = [
      date,
      efRev, efExp, efProf,
      bfRev, bfExp, bfProf,
      batRev, batExp, batProf,
      nyaRev, nyaExp, nyaProf,
      buRev, buExp, buProf,
      totalRev, totalExp, netProf,
      now.toISOString(),
    ];

    await prependRow('finance-summary', rowData);
    await prependRow('admin-log', [
      formatDate(now), formatTime(now), 'Finance',
      'Daily summary manually saved', userEmail, 'Submitted', now.toISOString(),
    ]);

    return NextResponse.json({ success: true, netProfit: netProf }, { status: 201 });
  } catch (error) {
    console.error('API Error in finance/route.ts [POST]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
