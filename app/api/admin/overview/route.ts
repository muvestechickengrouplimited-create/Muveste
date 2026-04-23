import { NextResponse } from 'next/server';
import { getRows } from '../../../../lib/sheets';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

// Map finance-expenses department labels → internal keys (case-insensitive lookup)
// This must match the mapping in api/finance/route.ts
const DEPT_KEY_MAP: Record<string, string> = {
  'egg farm': 'ef', 'broiler farm': 'bf',
  'kiosk batsinda': 'kBat', 'kiosk nyabugogo': 'kNya',
  'butchery': 'bu', 'butcher': 'bu',
};

// Helper: get egg-farm values with correct indices based on format
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

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    if (token.email?.toLowerCase() !== 'admin@30plus.rw') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // 'daily' | 'monthly'
    const today = new Date().toISOString().split('T')[0];
    const targetMonth = today.substring(0, 7); // YYYY-MM

    // Fetch all department sheets + finance-expenses + broiler batches
    const [efRows, bfRows, ekRows, buRows, finExpRows, batchRows] = await Promise.all([
      getRows('egg-farm'), getRows('broiler-farm'), getRows('egg-kiosk'), getRows('butcher'), getRows('finance-expenses'), getRows('broiler-batches')
    ]);

    const allBatchNames: string[] = (batchRows || []).slice(1).map((r: string[]) => r[0]).filter(Boolean);
    const dynamicDeptMap = { ...DEPT_KEY_MAP };
    for (const name of allBatchNames) {
      dynamicDeptMap[`broiler — ${name}`.toLowerCase()] = `batch_${name}`;
      dynamicDeptMap[`broiler - ${name}`.toLowerCase()] = `batch_${name}`;
    }

    // Date filtering utility
    const filterByDate = (rows: any[], target: string, isMonthly: boolean) => {
      const data = rows.slice(1);
      return data.filter(r => {
        const norm = normalizeDate(r[0]);
        if (!norm) return false;
        return isMonthly ? norm.startsWith(target) : norm === target;
      });
    };

    const isMonthly = period === 'monthly';
    const target = isMonthly ? targetMonth : today;

    // ─── AGGREGATION LOGIC (MATCHES FINANCE API) ──────────────────────────────────
    
    // 1. Process Finance Extras
    const finExpFiltered = filterByDate(finExpRows || [], target, isMonthly);
    const extrasPerDate: Record<string, Record<string, number>> = {};
    for (const r of finExpFiltered) {
      const d = normalizeDate(r[0]);
      if (!d) continue;
      const amount = parseNum(r[3]);
      const depts = String(r[2] || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (depts.length > 0 && amount !== 0) {
        const share = amount / depts.length;
        if (!extrasPerDate[d]) extrasPerDate[d] = {};
        for (const deptLabel of depts) {
          const key = dynamicDeptMap[deptLabel];
          if (key) extrasPerDate[d][key] = (extrasPerDate[d][key] || 0) + share;
        }
      }
    }

    // 2. Build aggregator for daily data
    const buildDailySummary = (dateStr: string) => {
      const efDay = filterByDate(efRows || [], dateStr, false);
      const bfDay = filterByDate(bfRows || [], dateStr, false);
      const ekDay = filterByDate(ekRows || [], dateStr, false);
      const buDay = filterByDate(buRows || [], dateStr, false);
      const dayExtras = extrasPerDate[dateStr] || {};

      let efRev = 0, efExp = 0;
      for (const r of efDay) { const v = getEfValues(r); efRev += v.rev; efExp += v.exp; }

      let bfTotalRev = 0, bfTotalExp = 0;
      const batchData: Record<string, { rev: number; exp: number }> = {};
      const batchApiData: Record<string, { revenue: number; expenses: number }> = {};
      for (const r of bfDay) {
        const bname = r[1];
        if (!batchData[bname]) batchData[bname] = { rev: 0, exp: 0 };
        batchData[bname].rev += parseNum(r[15]); // Index 15 = Revenue
        batchData[bname].exp += parseNum(r[14]); // Index 14 = Expenses
      }
      for (const name of allBatchNames) {
        const vals = batchData[name] || { rev: 0, exp: 0 };
        const bExtra = dayExtras[`batch_${name}`] || 0;
        bfTotalRev += vals.rev;
        bfTotalExp += (vals.exp + bExtra);
        // Store per-batch API data (includes finance extras)
        batchApiData[`broiler_${name}`] = { revenue: vals.rev, expenses: vals.exp + bExtra };
      }

      let batRev = 0, batExp = 0, nyaRev = 0, nyaExp = 0;
      for (const r of ekDay) {
        const loc = String(r[1] || '').toLowerCase();
        if (loc.includes('batsinda')) { batRev += parseNum(r[7]); batExp += parseNum(r[6]); }
        else if (loc.includes('nyabugogo')) { nyaRev += parseNum(r[7]); nyaExp += parseNum(r[6]); }
      }

      let buRev = 0, buExp = 0;
      for (const r of buDay) { buRev += parseNum(r[7]); buExp += parseNum(r[6]); }

      // Add non-batch finance extras
      efExp += (dayExtras.ef || 0);
      batExp += (dayExtras.kBat || 0);
      nyaExp += (dayExtras.kNya || 0);
      buExp += (dayExtras.bu || 0);
      bfTotalExp += (dayExtras.bf || 0); // Flat farm extras

      return {
        date: dateStr,
        eggFarm: { active: !!efDay[0], revenue: efRev, expenses: efExp, profit: efRev - efExp, rawData: efDay[0] || [], allRows: efRows.slice(1).filter(r => normalizeDate(r[0]) === dateStr) },
        broiler: { active: !!bfDay[0], revenue: bfTotalRev, expenses: bfTotalExp, profit: bfTotalRev - bfTotalExp, rawData: bfDay[0] || [], allRows: bfRows.slice(1).filter(r => normalizeDate(r[0]) === dateStr) },
        eggKioskBatsinda: { active: !!ekDay.find(r => String(r[1] || '').includes('Batsinda')), revenue: batRev, expenses: batExp, profit: batRev - batExp, rawData: ekDay.find(r => String(r[1] || '').includes('Batsinda')) || [], allRows: ekRows.slice(1).filter(r => normalizeDate(r[0]) === dateStr && String(r[1] || '').includes('Batsinda')) },
        eggKioskNyabugogo: { active: !!ekDay.find(r => String(r[1] || '').includes('Nyabugogo')), revenue: nyaRev, expenses: nyaExp, profit: nyaRev - nyaExp, rawData: ekDay.find(r => String(r[1] || '').includes('Nyabugogo')) || [], allRows: ekRows.slice(1).filter(r => normalizeDate(r[0]) === dateStr && String(r[1] || '').includes('Nyabugogo')) },
        butcher: { active: !!buDay[0], revenue: buRev, expenses: buExp, profit: buRev - buExp, rawData: buDay[0] || [], allRows: buRows.slice(1).filter(r => normalizeDate(r[0]) === dateStr) },
        totals: { revenue: efRev + bfTotalRev + batRev + nyaRev + buRev, expenses: efExp + bfTotalExp + batExp + nyaExp + buExp },
        // Per-batch data with finance extras — keyed as broiler_BatchName
        ...batchApiData,
      };
    };

    if (isMonthly) {
      // For monthly view, we iterate all unique dates in the target month
      const allDates = new Set<string>();
      [efRows, bfRows, ekRows, buRows].forEach(sheet => {
        (sheet || []).slice(1).forEach(r => {
          const d = normalizeDate(r[0]);
          if (d && d.startsWith(targetMonth)) allDates.add(d);
        });
      });
      const daySummaries = Array.from(allDates).map(buildDailySummary);
      const totalRev = daySummaries.reduce((s, d) => s + d.totals.revenue, 0);
      const totalExp = daySummaries.reduce((s, d) => s + d.totals.expenses, 0);
      const activeCount = daySummaries.length; // Approximate active days

      return NextResponse.json({
        overview: { totalRevenue: totalRev, totalExpenses: totalExp, netProfit: totalRev - totalExp, activeDepts: activeCount },
        records: daySummaries.sort((a, b) => b.date.localeCompare(a.date))
      });
    }

    // Default: Daily summary for 'today'
    const summary = buildDailySummary(today);
    const activeDepts = [summary.eggFarm.active, summary.broiler.active, summary.eggKioskBatsinda.active, summary.eggKioskNyabugogo.active, summary.butcher.active].filter(Boolean).length;

    return NextResponse.json({
      overview: { 
        totalRevenue: summary.totals.revenue, 
        totalExpenses: summary.totals.expenses, 
        netProfit: summary.totals.revenue - summary.totals.expenses, 
        activeDepts 
      },
      departments: { 
        eggFarm: summary.eggFarm, 
        broiler: summary.broiler, 
        eggKioskBatsinda: summary.eggKioskBatsinda, 
        eggKioskNyabugogo: summary.eggKioskNyabugogo, 
        butcher: summary.butcher,
        eggKiosk: { revenue: summary.eggKioskBatsinda.revenue + summary.eggKioskNyabugogo.revenue, expenses: summary.eggKioskBatsinda.expenses + summary.eggKioskNyabugogo.expenses }
      }
    });
  } catch (error) {
    console.error('API Admin Overview Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
