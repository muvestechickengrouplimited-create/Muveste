'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { formatRWF } from '../../../lib/utils';
import { auth } from '../../../lib/firebase';

// Safely parse numbers that may contain commas or currency formatting
function parseNum(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const n = Number(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface DeptSummary {
  name: string;
  color: string;
  metrics: { label: string; value: string | number }[];
  revenue: number;
  expenses: number;
  profit: number;
  hasSubmittedToday: boolean;
}

interface DeptDetail {
  department: string;
  date: string;
  fields: { label: string; value: string }[];
  medications: string | null;
  revenue: number;
  expenses: number;
  profit: number;
  notes: string | null;
  noReport?: boolean;
}

interface FinanceRow {
  date: string;
  timestamp: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  eggFarmRevenue?: number;
  eggFarmExpenses?: number;
  eggFarmProfit?: number;
  broilerRevenue?: number;
  broilerExpenses?: number;
  broilerProfit?: number;
  kioskBatsindaRevenue?: number;
  kioskBatsindaExpenses?: number;
  kioskBatsindaProfit?: number;
  kioskNyabugogoRevenue?: number;
  kioskNyabugogoExpenses?: number;
  kioskNyabugogoProfit?: number;
  butcherRevenue?: number;
  butcherExpenses?: number;
  butcherProfit?: number;
}



// ─── Icons ──────────────────────────────────────────────────────────────────
function BirdIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#1B6B3A]" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19c-4.418 0-8-2.686-8-6 0-2.21 1.343-4.14 3.343-5.25A5 5 0 0117 10c1.5.5 3 1.75 3 3.5C20 16.866 16.418 19 12 19z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 6l2-2M8 6l-1-2" />
    </svg>
  );
}

// ─── Config ─────────────────────────────────────────────────────────────────
const DEPT_CONFIG: Record<string, { color: string; primaryLabel: string; primaryKey: string; sheetName: string }> = {
  'Broiler Farm': { color: '#E07B00', primaryLabel: 'Live birds', primaryKey: 'liveBirds', sheetName: 'broiler-farm' },
  'Butchery (Kibungo)': { color: '#2D2D2D', primaryLabel: 'Meat sold', primaryKey: 'meatSold', sheetName: 'butcher-kibungo' },
  'Butchery (Rwamagana)': { color: '#1B6B3A', primaryLabel: 'Meat sold', primaryKey: 'meatSold', sheetName: 'butcher-rwamagana' },
  'Butchery (Nyabugogo)': { color: '#F5C518', primaryLabel: 'Meat sold', primaryKey: 'meatSold', sheetName: 'butcher-nyabugogo' },
};

function getDeptColor(name: string): string {
  return DEPT_CONFIG[name]?.color || '#cbd5e1';
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ title, value, color, sub }: { title: string; value: string; color: string; sub: string }) {
  const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    green: { bg: 'bg-white', border: 'border-[#1B6B3A]', text: 'text-[#1B6B3A]', iconBg: 'bg-[#EAF5EE]' },
    orange: { bg: 'bg-white', border: 'border-[#E07B00]', text: 'text-[#E07B00]', iconBg: 'bg-[#FFF8E1]' },
    red: { bg: 'bg-white', border: 'border-[#D9534F]', text: 'text-[#D9534F]', iconBg: 'bg-red-50' },
    yellow: { bg: 'bg-white', border: 'border-[#F5C518]', text: 'text-[#E07B00]', iconBg: 'bg-[#FFF8E1]' },
  };
  const c = colorMap[color] || colorMap.green;

  return (
    <div className={`${c.bg} rounded-2xl border-l-4 ${c.border} p-5 shadow-sm`}>
      <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-bold font-mono mt-1 ${c.text}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200/60 rounded-xl ${className}`} />
);

// ─── Status Pill ────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: 'Active' | 'Pending' }) {
  return (
    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${status === 'Active'
      ? 'bg-[#EAF5EE] text-[#1B6B3A]'
      : 'bg-orange-50 text-[#E07B00]'
      }`}>
      {status}
    </span>
  );
}

// ─── Department Summary Card ────────────────────────────────────────────────
function DeptSummaryCard({ dept, onClick }: { dept: DeptSummary; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer
                 hover:border-[#1B6B3A] hover:shadow-md transition-all duration-200"
    >
      {/* Header row */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: dept.color }} />
          <span className="font-semibold text-[#2D2D2D]">{dept.name === 'butcher' ? 'Butchery' : dept.name}</span>
        </div>
        <StatusPill status={dept.hasSubmittedToday ? 'Active' : 'Pending'} />
      </div>

      {/* 3 key stats */}
      <div className="space-y-2 mt-4">
        {dept.metrics && dept.metrics.map(m => (
          <div key={m.label} className="flex justify-between text-sm">
            <span className="text-gray-400">{m.label}</span>
            <span className="font-medium text-[#2D2D2D]">{m.value}</span>
          </div>
        ))}
        {dept.metrics && dept.metrics.length > 0 && <div className="border-t border-gray-50 my-2" />}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Revenue</span>
          <span className="font-medium text-[#1B6B3A]">{formatRWF(dept.revenue)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Expenses</span>
          <span className="font-medium text-[#E07B00]">{formatRWF(dept.expenses)}</span>
        </div>
        <div className="flex justify-between text-sm pt-1 mt-1 border-t border-gray-50">
          <span className="text-gray-500 font-semibold">Profit</span>
          <span className={`font-bold ${dept.profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}`}>
            {formatRWF(dept.profit)}
          </span>
        </div>
      </div>

      {/* Click hint */}
      <p className="text-xs text-gray-300 text-right mt-3">Click for full details →</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DeptSummary[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [activeDepts, setActiveDepts] = useState(0);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [allFinanceRows, setAllFinanceRows] = useState<FinanceRow[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [errorMonthly, setErrorMonthly] = useState<string | null>(null);

  // Modal state
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [deptDetails, setDeptDetails] = useState<DeptDetail | null>(null);

  // Batch management
  const [batches, setBatches] = useState<string[][]>([]);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const closeModal = useCallback(() => {
    setSelectedDept(null);
    setDeptDetails(null);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeModal]);

  const { filtered, monthlyRevenue, monthlyExpenses, monthlyProfit } = React.useMemo(() => {
    const rows = allFinanceRows;
    const filteredRows = rows.filter((row: FinanceRow) => {
      if (!row.date) return false;
      const date = new Date(row.date);
      return date.getFullYear() === selectedYear &&
        date.getMonth() === selectedMonth;
    });

    if (!filteredRows || filteredRows.length === 0) {
      return { filtered: [], monthlyRevenue: 0, monthlyExpenses: 0, monthlyProfit: 0 };
    }

    const calculatedRevenue = filteredRows.reduce((sum, r: FinanceRow) => sum + (r.totalRevenue || 0), 0);
    const calculatedExpenses = filteredRows.reduce((sum, r: FinanceRow) => sum + (r.totalExpenses || 0), 0);
    const calculatedProfit = filteredRows.reduce((sum, r: FinanceRow) => sum + (r.netProfit || 0), 0);

    return { 
      filtered: filteredRows, 
      monthlyRevenue: calculatedRevenue, 
      monthlyExpenses: calculatedExpenses, 
      monthlyProfit: calculatedProfit 
    };
  }, [allFinanceRows, selectedYear, selectedMonth]);

  // ─── Fetch overview data ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      setLoading(true);
      setError(null);
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        clearTimeout(timeout);
        return;
      }

      // Fetch overview and logs in parallel
      const [res, logRes, kioskRawRes, batchesRes] = await Promise.all([
        fetch(`/api/admin/overview?period=daily`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
        fetch(`/api/admin/department?dept=admin-log`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
        fetch(`/api/admin/department?dept=egg-kiosk`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
        fetch(`/api/admin/batches`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
      ]);

      clearTimeout(timeout);

      const batchesData = batchesRes.ok ? await batchesRes.json() : [];
      setBatches(batchesData);

      let logData: string[][] = [];
      if (logRes.ok) {
        const logJson = await logRes.json();
        logData = logJson.data || [];
      }

      let kioskRows: string[][] = [];
      if (kioskRawRes?.ok) {
        const d = await kioskRawRes.json();
        kioskRows = d.data || [];
      }

      // Unified logic for today's date calculation
      const todayObj = new Date();
      const todayFormatted = todayObj.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
      const todayISO = todayObj.toISOString().split('T')[0];

      if (res.ok) {
        const json = await res.json();
        const ov = json.overview || { totalRevenue: 0, totalExpenses: 0, netProfit: 0, activeDepts: 0 };
        const dpts = json.departments || {};

        setTotalRevenue(ov.totalRevenue);
        setTotalExpenses(ov.totalExpenses);
        setNetProfit(ov.netProfit);

        // Use kioskRows only for display metrics (trays etc) — NOT for financials.
        // Financials come from the API (dpts) which already include finance extras.
        const batToday = kioskRows.filter((r) => r[0] === todayISO && r[1]?.includes('Batsinda'));
        const nyaToday = kioskRows.filter((r) => r[0] === todayISO && r[1]?.includes('Nyabugogo'));

        const batEggs = batToday.reduce((sum, kr) => sum + parseNum(kr[3]), 0);
        const nyaEggs = nyaToday.reduce((sum, kr) => sum + parseNum(kr[3]), 0);

        // Egg Farm rawData indices (newest 27-col format):
        const efData = dpts['eggFarm']?.rawData || [];
        const isEfBirdsSold = efData.length >= 27;
        const isEfNew = efData.length >= 20;
        const efMetrics = [
          { label: 'Total eggs', value: parseNum(efData[isEfBirdsSold ? 15 : (isEfNew ? 13 : 10)]).toLocaleString() },
          { label: 'Fresh eggs', value: parseNum(efData[isEfBirdsSold ? 10 : (isEfNew ? 8 : 5)]).toLocaleString() },
          { label: 'Broken eggs', value: parseNum(efData[isEfBirdsSold ? 14 : (isEfNew ? 12 : 9)]).toLocaleString() },
          { label: 'Live birds', value: parseNum(efData[isEfBirdsSold ? 9 : (isEfNew ? 7 : 0)]).toLocaleString() }
        ];

        const bfData = dpts['broiler']?.rawData || [];
        const bfMetrics = [
          { label: 'Live birds', value: parseNum(bfData[9]).toLocaleString() },
          { label: 'Mortality', value: parseNum(bfData[7]).toLocaleString() },
          { label: 'Birds sold', value: parseNum(bfData[8]).toLocaleString() },
          { label: 'Kgs sold', value: parseNum(bfData[11]).toLocaleString() }
        ];
        
        const bkData = dpts['bk']?.rawData || [];
        const bkMetrics = [
          { label: 'Meat received', value: `${parseNum(bkData[1]).toLocaleString()} kg` },
          { label: 'Meat sold', value: `${parseNum(bkData[2]).toLocaleString()} kg` },
          { label: 'Damaged', value: `${parseNum(bkData[4]).toLocaleString()} kg` }
        ];

        const brData = dpts['br']?.rawData || [];
        const brMetrics = [
          { label: 'Meat received', value: `${parseNum(brData[1]).toLocaleString()} kg` },
          { label: 'Meat sold', value: `${parseNum(brData[2]).toLocaleString()} kg` },
          { label: 'Damaged', value: `${parseNum(brData[4]).toLocaleString()} kg` }
        ];

        const bnData = dpts['bn']?.rawData || [];
        const bnMetrics = [
          { label: 'Meat received', value: `${parseNum(bnData[1]).toLocaleString()} kg` },
          { label: 'Meat sold', value: `${parseNum(bnData[2]).toLocaleString()} kg` },
          { label: 'Damaged', value: `${parseNum(bnData[4]).toLocaleString()} kg` }
        ];

        // Merge display metrics into API dept data (API already has correct revenue/expenses/profit incl. finance extras)
        dpts['broiler'] = { ...dpts['broiler'], metrics: bfMetrics };
        dpts['bk'] = { ...dpts['bk'], metrics: bkMetrics };
        dpts['br'] = { ...dpts['br'], metrics: brMetrics };
        dpts['bn'] = { ...dpts['bn'], metrics: bnMetrics };

        // Build department summaries — use API's `active` flag (based on actual data rows)
        const deptNames = Object.keys(DEPT_CONFIG);
        const deptKeyMap: Record<string, string> = {
          'Broiler Farm': 'broiler',
          'Butchery (Kibungo)': 'bk',
          'Butchery (Rwamagana)': 'br',
          'Butchery (Nyabugogo)': 'bn',
        };

        const summaries: DeptSummary[] = deptNames.map(name => {
          const config = DEPT_CONFIG[name];
          const d = dpts[deptKeyMap[name]] || {};

          // Use the API's active flag directly — it checks real data rows, not admin-log
          const hasSubmitted = d.active === true;

          return {
            name,
            color: config.color,
            metrics: d.metrics || [],
            revenue: d.revenue || 0,
            expenses: d.expenses || 0,
            profit: d.profit !== undefined ? d.profit : ((d.revenue || 0) - (d.expenses || 0)),
            hasSubmittedToday: hasSubmitted,
          };
        });

        const calculatedActiveCount = summaries.filter(s => s.hasSubmittedToday).length;
        
        // Split dynamic broiler batches — use API batchData which includes finance extras
        const broilerRecords: string[][] = dpts['broiler']?.allRows || [];
        const broilerSummaries: DeptSummary[] = batchesData.map((b: string[]) => {
          const batchName = b[0];
          const batchRows = broilerRecords.filter(r => r[1] === batchName);
          const batchTodayMatch = batchRows.find(r => r[0] === todayISO);
          
          // Use API-calculated batch financials from batchData (includes finance extras)
          // Key format: broiler_BatchName
          const batchApiKey = `broiler_${batchName}`;
          const batchApiData = dpts[batchApiKey] || null;

          return {
            name: `Broiler — ${batchName}`,
            color: '#E07B00',
            metrics: [
              { label: 'Live birds', value: parseNum(batchTodayMatch?.[9]).toLocaleString() },
              { label: 'Mortality', value: parseNum(batchTodayMatch?.[7]).toLocaleString() },
              { label: 'Birds sold', value: parseNum(batchTodayMatch?.[8]).toLocaleString() },
              { label: 'Kgs sold', value: parseNum(batchTodayMatch?.[11]).toLocaleString() }
            ],
            // Prefer API-calculated values (include finance extras); fall back to raw row
            revenue: batchApiData?.revenue ?? parseNum(batchTodayMatch?.[15]),
            expenses: batchApiData?.expenses ?? parseNum(batchTodayMatch?.[14]),
            profit: batchApiData ? (batchApiData.revenue - batchApiData.expenses) : parseNum(batchTodayMatch?.[16]),
            hasSubmittedToday: !!batchTodayMatch
          };
        });

        // Filter out the generic "Broiler Farm" if we have batches, or replace it
        const finalSummaries = [
          ...summaries.filter(s => s.name !== 'Broiler Farm'),
          ...broilerSummaries
        ];

        setActiveDepts(finalSummaries.filter(s => s.hasSubmittedToday).length);
        setDepartments(finalSummaries);
      }


    } catch (err) {
      clearTimeout(timeout);
      console.error(err);
      setError('Failed to fetch dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchAllFinanceData = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      setLoadingMonthly(true);
      setErrorMonthly(null);
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        clearTimeout(timeout);
        return;
      }

      const res = await fetch(`/api/finance`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const rows = json.data || [];

        setAllFinanceRows(rows);

        const years = new Set<number>();
        (rows || []).forEach((row: FinanceRow) => {
          if (row.date) {
            const d = new Date(row.date);
            if (!isNaN(d.getFullYear())) years.add(d.getFullYear());
          }
        });
        years.add(new Date().getFullYear());
        setAvailableYears(Array.from(years).sort((a, b) => b - a));
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error(err);
      setErrorMonthly('Failed to fetch monthly data. Please refresh.');
    } finally {
      setLoadingMonthly(false);
    }
  }, []);

  useEffect(() => {
    fetchAllFinanceData();
  }, [fetchAllFinanceData]);

  // ─── Modal handlers ─────────────────────────────────────────────────────
  const openModal = async (deptName: string) => {
    setSelectedDept(deptName);
    setDeptDetails(null);

    try {
      const token = await auth.currentUser?.getIdToken();

      if (deptName.startsWith('Egg Kiosk')) {
        // Use structured ?date= mode — only fetches the matched row, fast
        const filterLoc = deptName.includes('Batsinda') ? 'Batsinda' : 'Nyabugogo';
        const res = await fetch(
          `/api/admin/department?dept=egg-kiosk&date=${today}&location=${encodeURIComponent(filterLoc)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const d = await res.json();
          if (d.noReport) {
            setDeptDetails({ department: deptName, date: today, fields: [], medications: null, revenue: 0, expenses: 0, profit: 0, notes: null, noReport: true });
          } else {
            setDeptDetails({ ...d, department: deptName });
          }
        }

      } else if (deptName.startsWith('Broiler — ')) {
        // Use the broiler API's ?batch=&date= endpoint — returns only that row
        const batchName = deptName.replace('Broiler — ', '');
        const res = await fetch(
          `/api/broiler-farm?batch=${encodeURIComponent(batchName)}&date=${today}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const d = await res.json();
          if (!d.success || !d.data) {
            setDeptDetails({ department: deptName, date: today, fields: [], medications: null, revenue: 0, expenses: 0, profit: 0, notes: null, noReport: true });
          } else {
            const r = d.data;
            setDeptDetails({
              department: deptName, date: today,
              fields: [
                { label: 'Batch',           value: r.batch },
                { label: 'Number of Birds', value: String(r.numberOfBirds || '0') },
                { label: 'Mortality',       value: String(r.mortality || '0') },
                { label: 'Birds Sold',      value: String(r.birdsSold || '0') },
                { label: 'Live Birds',      value: String(r.liveBirds || '0') },
                { label: 'Avg Weight',      value: `${r.avgWeight || '0'} kg` },
                { label: 'Kgs Sold',        value: `${r.kgsSold || '0'} kg` },
                { label: 'Total Weight',    value: `${r.totalWeight || '0'} kg` },
                { label: 'Feed Qty',        value: `${r.feedQty || '0'} kg` },
                { label: 'Water',           value: `${r.water || '0'} L` },
                { label: 'Medications',     value: r.medications || 'None' },
              ],
              medications: r.medications || null,
              revenue: parseNum(r.revenue),
              expenses: parseNum(r.expenses),
              profit: parseNum(r.profit),
              notes: r.notes || null
            });
          }
        } else {
          setDeptDetails({ department: deptName, date: today, fields: [], medications: null, revenue: 0, expenses: 0, profit: 0, notes: null, noReport: true });
        }

      } else if (deptName === 'Egg Farm') {
        // Use structured ?date= mode for egg farm too
        const res = await fetch(
          `/api/admin/department?dept=egg-farm&date=${today}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const d = await res.json();
          if (d.noReport) {
            setDeptDetails({ department: deptName, date: today, fields: [], medications: null, revenue: 0, expenses: 0, profit: 0, notes: null, noReport: true });
          } else {
            setDeptDetails({ ...d, department: deptName });
          }
        }

      } else {
        // Butcher and any other dept — use structured ?date= mode
        const res = await fetch(
          `/api/admin/department?dept=${encodeURIComponent(deptName)}&date=${today}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const d = await res.json();
          if (d.noReport) {
            setDeptDetails({ department: deptName, date: today, fields: [], medications: null, revenue: 0, expenses: 0, profit: 0, notes: null, noReport: true });
          } else {
            setDeptDetails({ ...d, department: deptName });
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createBatch = async () => {
    if (!newBatchName.trim()) return;
    try {
      const res = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName: newBatchName,
          createdDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          createdBy: auth.currentUser?.email
        })
      });
      if (res.ok) {
        setNewBatchName('');
        setShowAddBatch(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBatchStatus = async (batchName: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch('/api/admin/batches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName,
          status: newStatus
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Active depts color logic ───────────────────────────────────────────
  const activeDeptColor = activeDepts === 5 ? 'green' : activeDepts === 0 ? 'red' : 'yellow';

  // ─── Modal header color per department ──────────────────────────────────
  const getModalHeaderColor = (name: string) => DEPT_CONFIG[name]?.color || '#1B6B3A';

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#1B6B3A]">Master Overview</h1>
        <p className="text-[#111827] opacity-70 text-base">Super Administrator Dashboard</p>
      </div>

      {error ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center max-w-xl mx-auto my-8">
          <p className="text-red-700 font-bold text-lg mb-2">Something went wrong</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchData()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-xl transition duration-150 shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-44" />
                <Skeleton className="h-44" />
                <Skeleton className="h-44" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-80" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ═══ SECTION 1 — TOP STAT CARDS ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Total revenue" value={formatRWF(totalRevenue)} color="green" sub="RWF today" />
            <StatCard title="Total expenses" value={formatRWF(totalExpenses)} color="orange" sub="RWF today" />
            <StatCard title="Net profit" value={formatRWF(netProfit)} color={netProfit >= 0 ? 'green' : 'red'} sub="RWF today" />
          </div>

          {/* ═══ SECTION 2 — DEPARTMENT CARDS ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-[#111827] mb-4">Department Performance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map(dept => (
                  <DeptSummaryCard key={dept.name} dept={dept} onClick={() => openModal(dept.name)} />
                ))}
              </div>
            </div>

            {/* Broiler Batch Management */}
            <div>
              <h2 className="text-xl font-bold text-[#111827] mb-4">Broiler Farm</h2>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-[10px] text-[#E07B00] font-bold tracking-widest uppercase">
                      SYSTEM DATA
                    </p>
                    <h3 className="text-lg font-bold text-[#2D2D2D]">
                      Batch Management
                    </h3>
                  </div>
                  <button onClick={() => setShowAddBatch(true)}
                    className="bg-[#F5C518] text-[#2D2D2D] rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-[#E07B00] hover:text-white transition shadow-sm">
                    + New Batch
                  </button>
                </div>

                <div className="space-y-4">
                  {batches.map(batch => (
                    <div key={batch[0]} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FFF8E1] rounded-xl flex items-center justify-center text-sm font-bold text-[#E07B00]">
                          {batch[0].charAt(batch[0].length - 1)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#2D2D2D]">
                            {batch[0]}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            Created: {batch[1]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full
                          ${batch[2] === 'Active' 
                            ? 'bg-[#EAF5EE] text-[#1B6B3A]' 
                            : 'bg-gray-100 text-gray-400'}`}>
                          {batch[2]}
                        </span>
                        <button onClick={() => toggleBatchStatus(batch[0], batch[2])}
                          className="text-[10px] text-gray-500 font-bold border border-gray-200 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition">
                          {batch[2] === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Add Batch Modal */}
          {showAddBatch && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#EAF5EE] rounded-xl flex items-center justify-center">
                    <BirdIcon />
                  </div>
                  <h3 className="font-bold text-lg text-[#2D2D2D]">
                    Create New Batch
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Enter a unique identifier for the new broiler flock. 
                  This will appear in the daily reports.
                </p>
                <input
                  placeholder="Batch name e.g. Batch C"
                  autoFocus
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3.5 text-sm outline-none mb-6 focus:border-[#F5C518] transition-colors"
                  value={newBatchName}
                  onChange={e => setNewBatchName(e.target.value)}
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowAddBatch(false)}
                    className="flex-1 border-2 border-gray-100 rounded-xl py-3 text-sm font-bold text-gray-400 hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button onClick={createBatch}
                    className="flex-1 bg-[#1B6B3A] text-white rounded-xl py-3 text-sm font-bold hover:bg-[#15522c] shadow-lg active:scale-95 transition">
                    Create Batch
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ SECTION 3 — MONTHLY PERFORMANCE ═══ */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-[#111827] mb-4">Monthly Performance</h2>

            {/* Year Tabs */}
            <div className="flex flex-row flex-nowrap overflow-x-auto pb-2 mb-4 -mx-4 px-4 gap-3 scrollbar-none">
              {availableYears.map(year => {
                const isSelected = selectedYear === year;
                return (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-full text-base font-bold transition-colors shadow-sm ${isSelected
                      ? 'bg-[#F5C518] text-[#2D2D2D] border-2 border-[#F5C518]'
                      : 'bg-white text-gray-500 border-2 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>

            {/* Nav Tabs */}
            <div className="flex flex-row flex-nowrap overflow-x-auto pb-2 mb-4 -mx-4 px-4 gap-2 scrollbar-none">
              {[
                { label: 'January', val: 0 }, { label: 'February', val: 1 },
                { label: 'March', val: 2 }, { label: 'April', val: 3 },
                { label: 'May', val: 4 }, { label: 'June', val: 5 },
                { label: 'July', val: 6 }, { label: 'August', val: 7 },
                { label: 'September', val: 8 }, { label: 'October', val: 9 },
                { label: 'November', val: 10 }, { label: 'December', val: 11 },
              ].map(m => {
                const isSelected = selectedMonth === m.val;
                return (
                  <button
                    key={m.val}
                    onClick={() => setSelectedMonth(m.val)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${isSelected
                      ? 'bg-[#F5C518] text-[#2D2D2D] border border-[#F5C518]'
                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {(() => {

              if (errorMonthly) {
                return (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center max-w-xl mx-auto my-4 shadow-sm">
                    <p className="text-red-700 font-bold mb-1">Failed to load monthly financials</p>
                    <p className="text-red-600 text-xs mb-3">{errorMonthly}</p>
                    <button
                      onClick={() => fetchAllFinanceData()}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition duration-150"
                    >
                      Retry Load
                    </button>
                  </div>
                );
              }

              if (loadingMonthly) {
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-28" />
                      <Skeleton className="h-28" />
                      <Skeleton className="h-28" />
                    </div>
                    <Skeleton className="h-44 w-full" />
                  </div>
                );
              }

              if (filtered.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                    <p className="text-gray-500 font-medium tracking-wide">No data recorded for this period yet</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Total Revenue" value={formatRWF(monthlyRevenue)} color="green" sub="entire month" />
                    <StatCard title="Total Expenses" value={formatRWF(monthlyExpenses)} color="orange" sub="entire month" />
                    <StatCard title="Net Profit" value={formatRWF(monthlyProfit)} color={monthlyProfit >= 0 ? 'green' : 'red'} sub="entire month" />
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-[#1B6B3A] text-white">
                          <tr>
                            <th className="p-4 font-semibold uppercase tracking-wide text-xs">Department</th>
                            <th className="p-4 font-semibold uppercase tracking-wide text-xs">Revenue</th>
                            <th className="p-4 font-semibold uppercase tracking-wide text-xs">Expenses</th>
                            <th className="p-4 font-semibold uppercase tracking-wide text-xs">Profit</th>
                            <th className="p-4 font-semibold uppercase tracking-wide text-xs">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(() => {
                            let efRev = 0, efExp = 0, efProf = 0;
                            let bfRev = 0, bfExp = 0, bfProf = 0;
                            let kBatRev = 0, kBatExp = 0, kBatProf = 0;
                            let kNyaRev = 0, kNyaExp = 0, kNyaProf = 0;
                            let buRev = 0, buExp = 0, buProf = 0;

                            filtered.forEach((r: FinanceRow) => {
                              efRev += Number(r.eggFarmRevenue) || 0; efExp += Number(r.eggFarmExpenses) || 0; efProf += Number(r.eggFarmProfit) || 0;
                              bfRev += Number(r.broilerRevenue) || 0; bfExp += Number(r.broilerExpenses) || 0; bfProf += Number(r.broilerProfit) || 0;
                              kBatRev += Number(r.kioskBatsindaRevenue) || 0; kBatExp += Number(r.kioskBatsindaExpenses) || 0; kBatProf += Number(r.kioskBatsindaProfit) || 0;
                              kNyaRev += Number(r.kioskNyabugogoRevenue) || 0; kNyaExp += Number(r.kioskNyabugogoExpenses) || 0; kNyaProf += Number(r.kioskNyabugogoProfit) || 0;
                              buRev += Number(r.butcherRevenue) || 0; buExp += Number(r.butcherExpenses) || 0; buProf += Number(r.butcherProfit) || 0;
                            });

                            const depts = [
                              { name: 'Egg Farm', rev: efRev, exp: efExp, prof: efProf },
                              { name: 'Broiler Farm', rev: bfRev, exp: bfExp, prof: bfProf },
                              { name: 'Kiosk Batsinda', rev: kBatRev, exp: kBatExp, prof: kBatProf },
                              { name: 'Kiosk Nyabugogo', rev: kNyaRev, exp: kNyaExp, prof: kNyaProf },
                              { name: 'Butchery', rev: buRev, exp: buExp, prof: buProf },
                            ];

                            return depts.map((d, i) => (
                              <tr key={d.name} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#EAF5EE]/30'} hover:bg-gray-50 transition-colors`}>
                                <td className="p-4 font-semibold text-[#2D2D2D]">{d.name}</td>
                                <td className="p-4 font-mono text-gray-700">{formatRWF(d.rev)}</td>
                                <td className="p-4 font-mono text-gray-700">{formatRWF(d.exp)}</td>
                                <td className={`p-4 font-mono font-bold ${d.prof >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}`}>
                                  {formatRWF(d.prof)}
                                </td>
                                <td className="p-4">
                                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${d.prof >= 0 ? 'bg-[#EAF5EE] text-[#1B6B3A]' : 'bg-red-50 text-[#D9534F]'
                                    }`}>
                                    {d.prof >= 0 ? 'Profit' : 'Loss'}
                                  </span>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* ═══ SECTION 3 — DETAIL MODAL ═══ */}
      {selectedDept && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-0 md:p-4"
          onClick={closeModal}>
          <div className="bg-white rounded-none md:rounded-2xl w-full h-full md:h-auto md:max-w-lg overflow-hidden shadow-xl animate-in flex flex-col"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'modalIn 0.2s ease-out' }}>

            {/* Colored header */}
            <div className="px-6 py-4 flex justify-between items-center"
              style={{ backgroundColor: getModalHeaderColor(selectedDept) }}>
              <div>
                <h2 className="text-white font-semibold">{selectedDept === 'butcher' ? 'Butchery' : selectedDept} — full report</h2>
                <p className="text-white/70 text-xs mt-0.5">Today, {formattedDate}</p>
              </div>
              <button onClick={closeModal}
                className="text-white bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center transition shrink-0"
                aria-label="Close"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto md:max-h-[70vh]">

              {/* Loading state */}
              {!deptDetails && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-[#1B6B3A] border-t-transparent mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Loading details...</p>
                </div>
              )}

              {/* No report submitted */}
              {deptDetails && deptDetails.noReport && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-[#E07B00]" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No report submitted yet today</p>
                  <p className="text-xs text-gray-400 mt-1">This department hasn&apos;t recorded data for {today}</p>
                </div>
              )}

              {deptDetails && !deptDetails.noReport && (
                <>
                  {/* Daily figures grid */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                      Daily figures
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {deptDetails.fields.map((field) => (
                        <div key={field.label}
                          className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400">{field.label}</p>
                          <p className="font-semibold text-[#2D2D2D] mt-0.5">{field.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medications (Egg Farm and Broiler Farm only) */}
                  {deptDetails.medications && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                        Medications given
                      </p>
                      <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                        {deptDetails.medications || 'None recorded'}
                      </div>
                    </div>
                  )}

                  {/* Financials */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                      Financials
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#FFF8E1] border-2 border-[#F5C518] rounded-xl p-3">
                        <p className="text-xs text-[#E07B00]">Revenue</p>
                        <p className="font-bold text-[#2D2D2D] font-mono mt-0.5">
                          {formatRWF(deptDetails.revenue)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400">Expenses</p>
                        <p className="font-bold text-[#E07B00] font-mono mt-0.5">
                          {formatRWF(deptDetails.expenses)}
                        </p>
                      </div>
                      <div className={`rounded-xl p-3 col-span-2 border-2 ${deptDetails.profit >= 0
                        ? 'bg-[#EAF5EE] border-[#1B6B3A]'
                        : 'bg-red-50 border-[#D9534F]'
                        }`}>
                        <p className={`text-xs ${deptDetails.profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}`}>
                          Profit
                        </p>
                        <p className={`font-bold font-mono mt-0.5 text-lg ${deptDetails.profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'
                          }`}>
                          {formatRWF(deptDetails.profit)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">Notes</p>
                    <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                      {deptDetails.notes || 'No notes for today'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal animation keyframes */}
      <style jsx>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
