import { NextResponse } from 'next/server';
import { getRows } from '../../../../lib/sheets';
import admin from '../../../../lib/firebase-admin';

export const dynamic = 'force-dynamic';

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
const DEPT_KEY_MAP: Record<string, string> = {
  'broiler farm': 'bf',
  'butchery kibungo': 'bk', 'butchery - kibungo': 'bk', 'butchery — kibungo': 'bk',
  'butchery rwamagana': 'br', 'butchery - rwamagana': 'br', 'butchery — rwamagana': 'br',
  'butchery nyabugogo': 'bn', 'butchery - nyabugogo': 'bn', 'butchery — nyabugogo': 'bn',
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

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    const emailLower = token.email?.toLowerCase();
    if (emailLower !== 'admin@muveste.com') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // 'daily' | 'monthly'
    const today = new Date().toISOString().split('T')[0];
    const targetMonth = today.substring(0, 7); // YYYY-MM

    // Fetch only broiler-farm and butcher sheets + finance-expenses + broiler batches
    const [bfRows, bkRows, brRows, bnRows, finExpRows, batchRows] = await Promise.all([
      getRows('broiler-farm'), getRows('butcher-kibungo'), getRows('butcher-rwamagana'), getRows('butcher-nyabugogo'), getRows('finance-expenses'), getRows('broiler-batches')
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

    // ─── AGGREGATION LOGIC ──────────────────────────────────
    
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
      const bfDay = filterByDate(bfRows || [], dateStr, false);
      const bkDay = filterByDate(bkRows || [], dateStr, false);
      const brDay = filterByDate(brRows || [], dateStr, false);
      const bnDay = filterByDate(bnRows || [], dateStr, false);
      const dayExtras = extrasPerDate[dateStr] || {};

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

      let bkRev = 0, bkExp = 0;
      for (const r of bkDay) { bkRev += parseNum(r[8]); bkExp += (parseNum(r[3]) + parseNum(r[7])); }
      let brRev = 0, brExp = 0;
      for (const r of brDay) { brRev += parseNum(r[8]); brExp += (parseNum(r[3]) + parseNum(r[7])); }
      let bnRev = 0, bnExp = 0;
      for (const r of bnDay) { bnRev += parseNum(r[8]); bnExp += (parseNum(r[3]) + parseNum(r[7])); }

      bkExp += (dayExtras.bk || 0);
      brExp += (dayExtras.br || 0);
      bnExp += (dayExtras.bn || 0);
      bfTotalExp += (dayExtras.bf || 0); // Flat farm extras

      return {
        date: dateStr,
        broiler: { active: !!bfDay[0], revenue: bfTotalRev, expenses: bfTotalExp, profit: bfTotalRev - bfTotalExp, rawData: bfDay[0] || [], allRows: bfRows.slice(1).filter(r => normalizeDate(r[0]) === dateStr) },
        bk: { active: !!bkDay[0], revenue: bkRev, expenses: bkExp, profit: bkRev - bkExp, rawData: bkDay[0] || [], allRows: bkRows.slice(1).filter(r => normalizeDate(r[0]) === dateStr) },
        br: { active: !!brDay[0], revenue: brRev, expenses: brExp, profit: brRev - brExp, rawData: brDay[0] || [], allRows: brRows.slice(1).filter(r => normalizeDate(r[0]) === dateStr) },
        bn: { active: !!bnDay[0], revenue: bnRev, expenses: bnExp, profit: bnRev - bnExp, rawData: bnDay[0] || [], allRows: bnRows.slice(1).filter(r => normalizeDate(r[0]) === dateStr) },
        totals: { revenue: bfTotalRev + bkRev + brRev + bnRev, expenses: bfTotalExp + bkExp + brExp + bnExp },
        // Per-batch data with finance extras — keyed as broiler_BatchName
        ...batchApiData,
      };
    };

    if (isMonthly) {
      // For monthly view, we iterate all unique dates in the target month
      const allDates = new Set<string>();
      [bfRows, bkRows, brRows, bnRows].forEach(sheet => {
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
    const activeDepts = [summary.broiler.active, summary.bk.active, summary.br.active, summary.bn.active].filter(Boolean).length;

    const batchApiKeys = Object.keys(summary).filter(k => k.startsWith('broiler_'));
    const batchApiDataObj: Record<string, any> = {};
    for (const k of batchApiKeys) {
      batchApiDataObj[k] = (summary as any)[k];
    }

    return NextResponse.json({
      overview: { 
        totalRevenue: summary.totals.revenue, 
        totalExpenses: summary.totals.expenses, 
        netProfit: summary.totals.revenue - summary.totals.expenses, 
        activeDepts 
      },
      departments: { 
        broiler: summary.broiler, 
        bk: summary.bk,
        br: summary.br,
        bn: summary.bn,
        ...batchApiDataObj
      }
    });
  } catch (error) {
    console.error('API Admin Overview Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
