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
const FINANCE_DEPT_MAP: Record<string, string> = {
  'egg farm': 'eggFarm',
  'broiler farm': 'broiler',
  'kiosk batsinda': 'eggKiosk',
  'kiosk nyabugogo': 'eggKiosk',
  'butchery': 'butcher',
  'butcher': 'butcher',
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
    if (token.email?.toLowerCase() !== 'admin@30plus.rw') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // 'daily' | 'monthly'
    const today = new Date().toISOString().split('T')[0];
    const targetMonth = today.substring(0, 7); // YYYY-MM

    // 1. Fetch all department sheets + finance-expenses concurrently
    const [efRows, bfRows, ekRows, buRows, finExpRows] = await Promise.all([
      getRows('egg-farm'), getRows('broiler-farm'), getRows('egg-kiosk'), getRows('butcher'), getRows('finance-expenses'),
    ]);

    // ─── Filter rows by date ──────────────────────────────────────────
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

    const finExpFiltered = filterByDate(finExpRows || [], target, isMonthly);
    const efFiltered = filterByDate(efRows || [], target, isMonthly);
    const bfFiltered = filterByDate(bfRows || [], target, isMonthly);
    const ekFiltered = filterByDate(ekRows || [], target, isMonthly);
    const buFiltered = filterByDate(buRows || [], target, isMonthly);

    // ─── Process finance-expenses ──────────────────
    const financeExtras: Record<string, number> = { eggFarm: 0, broiler: 0, eggKiosk: 0, eggKioskBatsinda: 0, eggKioskNyabugogo: 0, butcher: 0 };
    for (const r of finExpFiltered) {
      const amount = parseNum(r[3]);
      if (amount === 0) continue;
      const depts = String(r[2] || '').toLowerCase().split(',').map(d => d.trim()).filter(Boolean);
      const share = amount / (depts.length || 1);
      for (const deptLabel of depts) {
        let key = FINANCE_DEPT_MAP[deptLabel];
        // Handle specific kiosk labels if present
        if (deptLabel === 'kiosk batsinda') key = 'eggKioskBatsinda';
        if (deptLabel === 'kiosk nyabugogo') key = 'eggKioskNyabugogo';
        
        if (key && financeExtras[key] !== undefined) financeExtras[key] += share;
      }
    }

    // ─── Process Departments ───────────────────────
    let efRevenue = 0, efExpenses = 0;
    for (const r of efFiltered) {
      const isBirdsSoldFmt = r.length >= 27;
      const isDoubleStockFmt = r.length === 26 || r.length === 25;
      const isProfitFmt = r.length === 24;
      const isNewest = r.length === 23;
      const isInter = r.length === 22;
      efRevenue += parseNum(r[isBirdsSoldFmt ? 22 : (isDoubleStockFmt ? 20 : (isProfitFmt ? 19 : (isNewest ? 19 : (isInter ? 18 : 13))))]);
      efExpenses += parseNum(r[isBirdsSoldFmt ? 21 : (isDoubleStockFmt ? 19 : (isProfitFmt ? 18 : (isNewest ? 18 : (isInter ? 17 : 12))))]);
    }

    let bfRevenue = 0, bfExpenses = 0;
    for (const r of bfFiltered) {
      bfRevenue += parseNum(r[14]);
      bfExpenses += parseNum(r[13]);
    }

    let batRevenue = 0, batExpenses = 0, nyaRevenue = 0, nyaExpenses = 0;
    for (const r of ekFiltered) {
      const loc = String(r[1] || '').toLowerCase();
      if (loc.includes('batsinda')) {
        batRevenue += parseNum(r[7]);
        batExpenses += parseNum(r[6]);
      } else if (loc.includes('nyabugogo')) {
        nyaRevenue += parseNum(r[7]);
        nyaExpenses += parseNum(r[6]);
      }
    }

    let buRevenue = 0, buExpenses = 0;
    for (const r of buFiltered) {
      buRevenue += parseNum(r[7]);
      buExpenses += parseNum(r[6]);
    }

    // ─── Add finance extras ─────────
    efExpenses += financeExtras.eggFarm;
    bfExpenses += financeExtras.broiler;
    batExpenses += (financeExtras.eggKiosk / 2) + financeExtras.eggKioskBatsinda;
    nyaExpenses += (financeExtras.eggKiosk / 2) + financeExtras.eggKioskNyabugogo;
    buExpenses += financeExtras.butcher;

    const efTodayRow = efFiltered.find(r => normalizeDate(r[0]) === today);
    const bfTodayRow = bfFiltered.find(r => normalizeDate(r[0]) === today);
    const batTodayRow = ekFiltered.find(r => normalizeDate(r[0]) === today && String(r[1] || '').includes('Batsinda'));
    const nyaTodayRow = ekFiltered.find(r => normalizeDate(r[0]) === today && String(r[1] || '').includes('Nyabugogo'));
    const buTodayRow = buFiltered.find(r => normalizeDate(r[0]) === today);

    // ─── Build department objects ────────────────────────────────────
    const eggFarm = {
      revenue: efRevenue,
      expenses: efExpenses,
      profit: efRevenue - efExpenses,
      active: !!efTodayRow,
      rawData: efTodayRow || [],
      allRows: efRows.slice(1) // Return all rows for frontend processing
    };

    const broiler = {
      revenue: bfRevenue,
      expenses: bfExpenses,
      profit: bfRevenue - bfExpenses,
      active: !!bfTodayRow,
      rawData: bfTodayRow || [],
      allRows: bfRows.slice(1)
    };

    const eggKioskBatsinda = {
      revenue: batRevenue,
      expenses: batExpenses,
      profit: batRevenue - batExpenses,
      active: !!batTodayRow,
      rawData: batTodayRow || [],
      allRows: ekRows.slice(1).filter(r => String(r[1] || '').includes('Batsinda'))
    };

    const eggKioskNyabugogo = {
      revenue: nyaRevenue,
      expenses: nyaExpenses,
      profit: nyaRevenue - nyaExpenses,
      active: !!nyaTodayRow,
      rawData: nyaTodayRow || [],
      allRows: ekRows.slice(1).filter(r => String(r[1] || '').includes('Nyabugogo'))
    };

    const butcher = {
      revenue: buRevenue,
      expenses: buExpenses,
      profit: buRevenue - buExpenses,
      active: !!buTodayRow,
      rawData: buTodayRow || [],
      allRows: buRows.slice(1)
    };

    // ─── Totals ─────────────────────────────────────────────────────
    const totalRevenue = efRevenue + bfRevenue + batRevenue + nyaRevenue + buRevenue;
    const totalExpenses = efExpenses + bfExpenses + batExpenses + nyaExpenses + buExpenses;
    const netProfit = totalRevenue - totalExpenses;

    const activeDepts = [eggFarm.active, broiler.active, eggKioskBatsinda.active, eggKioskNyabugogo.active, butcher.active].filter(Boolean).length;

    return NextResponse.json({
      overview: { totalRevenue, totalExpenses, netProfit, activeDepts },
      departments: { eggFarm, broiler, eggKioskBatsinda, eggKioskNyabugogo, butcher, eggKiosk: { revenue: batRevenue + nyaRevenue, expenses: batExpenses + nyaExpenses } }
    });
  } catch (error) {
    console.error('API Admin Overview Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
