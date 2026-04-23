'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/Toast';
import { formatRWF, formatDate } from '../../../lib/utils';
import { auth } from '../../../lib/firebase';

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface FinanceRecord {
  date: string;
  eggFarmRevenue: number; eggFarmExpenses: number; eggFarmProfit: number;
  broilerRevenue: number; broilerExpenses: number; broilerProfit: number;
  kioskBatsindaRevenue: number; kioskBatsindaExpenses: number; kioskBatsindaProfit: number;
  kioskNyabugogoRevenue: number; kioskNyabugogoExpenses: number; kioskNyabugogoProfit: number;
  butcherRevenue: number; butcherExpenses: number; butcherProfit: number;
  totalRevenue: number; totalExpenses: number; netProfit: number;
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const RevenueIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExpenseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ProfitIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const profitTextColor = (value: number) => {
  if (value > 0) return 'text-[#1B6B3A] font-semibold';
  if (value === 0) return 'text-gray-400';
  return 'text-[#D9534F] font-semibold';
};

// --- Row Components for Pagination ---
const BizExpenseRow = ({ 
  row, 
  index, 
  onUpdate, 
  onRemove,
  batches = [],
}: { 
  row: any, 
  index: number, 
  onUpdate: (index: number, field: string, value: any) => void,
  onRemove: (index: number) => void,
  batches?: string[],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Static depts + one entry per broiler batch
  const depts = [
    'Egg Farm',
    ...batches.map(b => `Broiler — ${b}`),
    'Kiosk Batsinda',
    'Kiosk Nyabugogo',
    'Butchery',
  ];

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDepts = Array.isArray(row.department) 
    ? row.department 
    : (row.department === 'All Departments' ? depts : (row.department ? [row.department] : []));

  const toggleDept = (dept: string) => {
    let newDepts: string[] = [];
    if (selectedDepts.includes(dept)) {
      newDepts = selectedDepts.filter((d: string) => d !== dept);
    } else {
      newDepts = [...selectedDepts, dept];
    }
    onUpdate(index, 'department', newDepts);
  };

  const toggleAll = () => {
    if (selectedDepts.length === depts.length) {
      onUpdate(index, 'department', []);
    } else {
      onUpdate(index, 'department', depts);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-3 mb-3 items-center animate-in fade-in slide-in-from-top-2 duration-300">
      <input
        value={row.name}
        onChange={(e) => onUpdate(index, 'name', e.target.value)}
        placeholder="e.g. Salaries, Rent..."
        className="border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none col-span-1 focus:border-[#F5C518]"
      />
      
      {/* Multi-select Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#F5C518] bg-white flex justify-between items-center cursor-pointer min-h-[44px]"
        >
          <span className="truncate max-w-[120px]">
            {selectedDepts.length === 0 ? "Select depts..." : 
             selectedDepts.length === depts.length ? "All Departments" :
             selectedDepts.join(", ")}
          </span>
          <span className="text-[10px] text-gray-400">▼</span>
        </div>

        {isOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-100 shadow-2xl rounded-xl p-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1">
             <div 
              onClick={toggleAll}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border-b mb-1"
            >
              <input 
                type="checkbox" 
                checked={selectedDepts.length === depts.length} 
                onChange={() => {}} 
                className="w-4 h-4 rounded border-gray-300 text-[#1B6B3A] focus:ring-[#1B6B3A]"
              />
              <span className="text-xs font-bold text-gray-700">Select All</span>
            </div>
            {depts.map(dept => (
              <div 
                key={dept}
                onClick={() => toggleDept(dept)}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              >
                <input 
                  type="checkbox" 
                  checked={selectedDepts.includes(dept)} 
                  onChange={() => {}} 
                  className="w-4 h-4 rounded border-gray-300 text-[#1B6B3A] focus:ring-[#1B6B3A]"
                />
                <span className="text-xs text-gray-700">{dept}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <input
        type="number"
        placeholder="Amount (RWF)"
        min={0}
        value={row.amount || ''}
        onChange={(e) => onUpdate(index, 'amount', parseFloat(e.target.value) || 0)}
        className="border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#F5C518]"
      />
      <button 
        onClick={() => onRemove(index)}
        className="bg-white border border-gray-200 text-[#D9534F] rounded-xl py-2.5 text-xs font-semibold hover:bg-red-50 transition"
      >
        Remove
      </button>
    </div>
  );
};

function HistoryRow({ row, batches }: { row: FinanceRecord; batches: string[] }) {
  const p = (v: number) => (v ?? 0).toLocaleString();
  return (
    <tr className="border-b hover:bg-gray-50 bg-white transition-colors duration-200">
      <td className="p-3 border-r font-medium text-gray-800 whitespace-nowrap">{formatDate(row.date)}</td>
      {/* Egg Farm */}
      <td className="p-2 font-mono text-gray-600">{p(row.eggFarmRevenue)}</td>
      <td className="p-2 font-mono text-gray-600">{p(row.eggFarmExpenses)}</td>
      <td className={`p-2 font-mono border-r ${profitTextColor(row.eggFarmProfit)}`}>{p(row.eggFarmProfit)}</td>
      {/* Per-batch Broiler */}
      {batches.map((bname, bi) => {
        const rev = (row as any)[`broiler_${bname}_revenue`] ?? 0;
        const exp = (row as any)[`broiler_${bname}_expenses`] ?? 0;
        const prof = (row as any)[`broiler_${bname}_profit`] ?? (rev - exp);
        return (
          <React.Fragment key={bname}>
            <td className="p-2 font-mono text-gray-600">{p(rev)}</td>
            <td className="p-2 font-mono text-gray-600">{p(exp)}</td>
            <td className={`p-2 font-mono border-r ${profitTextColor(prof)}`}>{p(prof)}</td>
          </React.Fragment>
        );
      })}
      {/* Kiosk Batsinda */}
      <td className="p-2 font-mono text-gray-600">{p(row.kioskBatsindaRevenue)}</td>
      <td className="p-2 font-mono text-gray-600">{p(row.kioskBatsindaExpenses)}</td>
      <td className={`p-2 font-mono border-r ${profitTextColor(row.kioskBatsindaProfit)}`}>{p(row.kioskBatsindaProfit)}</td>
      {/* Kiosk Nyabugogo */}
      <td className="p-2 font-mono text-gray-600">{p(row.kioskNyabugogoRevenue)}</td>
      <td className="p-2 font-mono text-gray-600">{p(row.kioskNyabugogoExpenses)}</td>
      <td className={`p-2 font-mono border-r ${profitTextColor(row.kioskNyabugogoProfit)}`}>{p(row.kioskNyabugogoProfit)}</td>
      {/* Butchery */}
      <td className="p-2 font-mono text-gray-600">{p(row.butcherRevenue)}</td>
      <td className="p-2 font-mono text-gray-600">{p(row.butcherExpenses)}</td>
      <td className={`p-2 font-mono border-r ${profitTextColor(row.butcherProfit)}`}>{p(row.butcherProfit)}</td>
      {/* Overall */}
      <td className="p-2 font-mono font-semibold text-[#1B6B3A]">{p(row.totalRevenue)}</td>
      <td className="p-2 font-mono font-semibold text-[#E07B00]">{p(row.totalExpenses)}</td>
      <td className={`p-2 font-mono text-base ${profitTextColor(row.netProfit)}`}>{p(row.netProfit)}</td>
    </tr>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function FinanceDashboard() {
  const { toast } = useToast();

  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');
  const [loadingTable, setLoadingTable] = useState(false);
  const [loadingAutoPull, setLoadingAutoPull] = useState(false);
  const [loadingTracker, setLoadingTracker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [batches, setBatches] = useState<string[]>([]);

  // --- Monthly Navigation State ---
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // --- Pagination State ---
  const [bizPage, setBizPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const rowsPerPage = 5;

  // --- Daily Expenses Tracker State ---
  const [trackerData, setTrackerData] = useState<Record<string, { value: number; submitted: boolean }>>({
    'Egg Farm': { value: 0, submitted: false },
    'Kiosk Batsinda': { value: 0, submitted: false },
    'Kiosk Nyabugogo': { value: 0, submitted: false },
    'Butchery': { value: 0, submitted: false },
  });

  const [financeExtras, setFinanceExtras] = useState<Record<string, number>>({});

  const [bizRows, setBizRows] = useState([
    { name: '', department: '', amount: 0 },
    { name: '', department: '', amount: 0 },
  ]);

  const [savingDailyExpenses, setSavingDailyExpenses] = useState(false);
  const [justUpdated, setJustUpdated] = useState<string | null>(null);

  // --- Derived Calculations ---
  // The department list is dynamic: fixed depts + one row per batch
  const broilerBatchDeptNames = batches.map(b => `Broiler — ${b}`);
  const departmentList = [
    'Egg Farm',
    ...broilerBatchDeptNames,
    'Kiosk Batsinda',
    'Kiosk Nyabugogo',
    'Butchery',
  ];
  const departmentColors: Record<string, string> = {
    'Egg Farm': '#1B6B3A',
    'Kiosk Batsinda': '#F5C518',
    'Kiosk Nyabugogo': '#E07B00',
    'Butchery': '#2D2D2D',
  };
  for (const b of batches) departmentColors[`Broiler — ${b}`] = '#E07B00';

  const totalDeptExpenses = departmentList.reduce((sum, dept) => sum + (trackerData[dept]?.value || 0), 0);
  const totalFinanceExtra = departmentList.reduce((sum, dept) => sum + (financeExtras[dept] || 0), 0);

  const calculateTotalBizExpenses = () => {
    return bizRows.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  };
  const totalBizExpenses = calculateTotalBizExpenses();
  
  const [grandTotalExpenses, setGrandTotalExpenses] = useState(0);

  useEffect(() => {
    // Grand total = base dept expenses + business expenses only.
    // NOTE: totalFinanceExtra is NOT added separately because the "Finance extra" column
    // in the tracker table IS the business expenses, just split per department — same money.
    setGrandTotalExpenses(totalDeptExpenses + totalBizExpenses);
  }, [totalDeptExpenses, totalBizExpenses]);

  // Toggle values
  const [monthlyStats, setMonthlyStats] = useState({
    monthlyRevenue: 0, monthlyExpenses: 0, monthlyProfit: 0, daysRecorded: 0
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);

  // Form State
  const [formDate, setFormDate] = useState(todayStr);
  const [fields, setFields] = useState({
    eggFarmRevenue: '', eggFarmExpenses: '',
    broilerRevenue: '', broilerExpenses: '',
    kioskBatsindaRevenue: '', kioskBatsindaExpenses: '',
    kioskNyabugogoRevenue: '', kioskNyabugogoExpenses: '',
    butcherRevenue: '', butcherExpenses: '',
  });

  const {
    efRev, efExp, efProfit,
    bfRev, bfExp, bfProfit,
    batRev, batExp, batProfit,
    nyaRev, nyaExp, nyaProfit,
    ekRev, ekExp,
    buRev, buExp, buProfit,
    totalRev, totalExp, netProfitCalc,
  } = React.useMemo(() => {
    // API returns decoupled base expenses, so we must manually add the allocated finance extras back
    // for both the Manual Entry form inputs and the final save payload.
    const efR = Number(fields.eggFarmRevenue) || 0;
    const efE = (trackerData['Egg Farm']?.value || 0) + (financeExtras['Egg Farm'] || 0);

    const bfR = Number(fields.broilerRevenue) || 0;
    const bfE = (trackerData['Broiler Farm']?.value || 0) + (financeExtras['Broiler Farm'] || 0);

    const batR = Number(fields.kioskBatsindaRevenue) || 0;
    const batE = (trackerData['Kiosk Batsinda']?.value || 0) + (financeExtras['Kiosk Batsinda'] || 0);

    const nyaR = Number(fields.kioskNyabugogoRevenue) || 0;
    const nyaE = (trackerData['Kiosk Nyabugogo']?.value || 0) + (financeExtras['Kiosk Nyabugogo'] || 0);

    const buR = Number(fields.butcherRevenue) || 0;
    const buE = (trackerData['Butchery']?.value || 0) + (financeExtras['Butchery'] || 0);

    const ekR = batR + nyaR;
    const ekE = batE + nyaE;
    
    const tRev = efR + bfR + ekR + buR;
    const tExp = grandTotalExpenses;

    return {
      efRev: efR, efExp: efE, efProfit: efR - efE,
      bfRev: bfR, bfExp: bfE, bfProfit: bfR - bfE,
      batRev: batR, batExp: batE, batProfit: batR - batE,
      nyaRev: nyaR, nyaExp: nyaE, nyaProfit: nyaR - nyaE,
      ekRev: ekR, ekExp: ekE,
      buRev: buR, buExp: buE, buProfit: buR - buE,
      totalRev: tRev, totalExp: tExp, netProfitCalc: tRev - tExp,
    };
  }, [fields, trackerData, financeExtras, grandTotalExpenses]);

  const monthlyDeptTotals = React.useMemo(() => {
    if (period !== 'monthly') return null;
    
    let efRev = 0, efExp = 0, efProf = 0;
    let bfRev = 0, bfExp = 0, bfProf = 0;
    let kBatRev = 0, kBatExp = 0, kBatProf = 0;
    let kNyaRev = 0, kNyaExp = 0, kNyaProf = 0;
    let buRev = 0, buExp = 0, buProf = 0;

    records.forEach((r) => {
      efRev += r.eggFarmRevenue || 0; efExp += r.eggFarmExpenses || 0; efProf += r.eggFarmProfit || 0;
      bfRev += r.broilerRevenue || 0; bfExp += r.broilerExpenses || 0; bfProf += r.broilerProfit || 0;
      kBatRev += r.kioskBatsindaRevenue || 0; kBatExp += r.kioskBatsindaExpenses || 0; kBatProf += r.kioskBatsindaProfit || 0;
      kNyaRev += r.kioskNyabugogoRevenue || 0; kNyaExp += r.kioskNyabugogoExpenses || 0; kNyaProf += r.kioskNyabugogoProfit || 0;
      buRev += r.butcherRevenue || 0; buExp += r.butcherExpenses || 0; buProf += r.butcherProfit || 0;
    });

    return [
      { name: 'Egg Farm', rev: efRev, exp: efExp, prof: efProf, color: '#1B6B3A' },
      { name: 'Broiler Farm', rev: bfRev, exp: bfExp, prof: bfProf, color: '#E07B00' },
      { name: 'Kiosk Batsinda', rev: kBatRev, exp: kBatExp, prof: kBatProf, color: '#F5C518' },
      { name: 'Kiosk Nyabugogo', rev: kNyaRev, exp: kNyaExp, prof: kNyaProf, color: '#E07B00' },
      { name: 'Butchery', rev: buRev, exp: buExp, prof: buProf, color: '#2D2D2D' },
    ];
  }, [records, period]);

  // ── Functions ─────────────────────────────────────────────────────────────
  const fetchTableData = useCallback(async () => {
    try {
      setLoadingTable(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

      const financeRes = await fetch(
        period === 'monthly' ? `/api/finance?period=monthly&month=${monthStr}` : '/api/finance',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let financeData: unknown = null;
      if (financeRes.ok) financeData = await financeRes.json();

      // Always capture batch names from response
      if (financeData && typeof financeData === 'object' && 'batches' in financeData) {
        setBatches((financeData as any).batches || []);
      }

      if (period === 'monthly' && financeData && typeof financeData === 'object' && 'records' in financeData) {
        setRecords((financeData as any).records || []);
        setMonthlyStats({
          monthlyRevenue: Number((financeData as any).monthlyRevenue) || 0,
          monthlyExpenses: Number((financeData as any).monthlyExpenses) || 0,
          monthlyProfit: Number((financeData as any).monthlyProfit) || 0,
          daysRecorded: Number((financeData as any).daysRecorded) || 0,
        });
      } else if (financeData && typeof financeData === 'object' && 'data' in financeData) {
        setRecords((financeData as { data: FinanceRecord[] }).data || []);
      }
    } catch (err) {
      console.error('Fetch table data failed:', err);
      toast('Failed to load records.', 'error');
    } finally {
      setLoadingTable(false);
    }
  }, [period, selectedYear, selectedMonth, toast]);

  const fetchAllFinanceData = useCallback(async () => {
    try {
      setLoadingMonthly(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch('/api/finance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const rows = json.data || [];
        
        const years = new Set<number>();
        (rows || []).forEach((row: FinanceRecord) => {
          if (row.date) {
            const d = new Date(row.date);
            if (!isNaN(d.getFullYear())) years.add(d.getFullYear());
          }
        });
        years.add(new Date().getFullYear());
        setAvailableYears(Array.from(years).sort((a, b) => b - a));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMonthly(false);
    }
  }, []);

  useEffect(() => {
    fetchAllFinanceData();
  }, [fetchAllFinanceData]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  const autoPullData = async (dateParam: string, manual = false) => {
    try {
      if (manual) setLoadingTracker(true);
      else setLoadingAutoPull(true);
      
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(`/api/finance?date=${dateParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const { data, tracker } = json;

        // Capture batch list
        if (json.batches) setBatches(json.batches);

        // Populate manual entry fields
        setFields(prev => ({
          ...prev,
          eggFarmRevenue: data.eggFarmRevenue?.toString() || '0',
          eggFarmExpenses: data.eggFarmExpenses?.toString() || '0',
          broilerRevenue: data.broilerRevenue?.toString() || '0',
          broilerExpenses: data.broilerExpenses?.toString() || '0',
          kioskBatsindaRevenue: data.kioskBatsindaRevenue?.toString() || '0',
          kioskBatsindaExpenses: data.kioskBatsindaExpenses?.toString() || '0',
          kioskNyabugogoRevenue: data.kioskNyabugogoRevenue?.toString() || '0',
          kioskNyabugogoExpenses: data.kioskNyabugogoExpenses?.toString() || '0',
          butcherRevenue: data.butcherRevenue?.toString() || '0',
          butcherExpenses: data.butcherExpenses?.toString() || '0',
        }));

        if (tracker) setTrackerData(tracker);

        if (manual) toast(`✅ Data updated for ${dateParam}`, 'success');
        else toast(`Auto-pulled data for ${dateParam}`, 'success');
      }
    } catch (err) {
      console.error('Auto pull failed:', err);
      toast('Failed to pull auto data.', 'error');
    } finally {
      setLoadingAutoPull(false);
      setLoadingTracker(false);
    }
  };

  // Pull data automatically when component mounts (defaulting to today)
  useEffect(() => {
    autoPullData(todayStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Fetch Tracker Data ---
  const fetchTrackerData = useCallback(async (manual = false) => {
    // We now just use the consolidated autoPullData for the selected date
    await autoPullData(formDate, manual);
  }, [formDate]);

  const loadSavedExpenses = useCallback(async () => {
    try {
      // Use formDate (YYYY-MM-DD) but convert if API expects Apr 9, 2026 style
      const targetDate = formatDate(formDate);
      const res = await fetch(`/api/finance/expenses?date=${targetDate}`);
      const { data } = await res.json();
      
      if (!data || data.length === 0) {
        // Clear if nothing saved for this day
        setBizRows([{ name: '', department: '', amount: 0 }, { name: '', department: '', amount: 0 }]);
        setFinanceExtras({});
        return;
      }

      // Separate business expenses from extras
      const savedBizRows = data
        .filter((row: string[]) => row[1] !== 'Finance extra')
        .map((row: string[]) => ({
          name      : row[1],
          department: row[2] ? row[2].split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          amount    : parseFloat(row[3]) || 0
        }));

      // Set business expense rows
      if (savedBizRows.length > 0) {
        setBizRows(savedBizRows);
        recalculateExtras(savedBizRows);
      }
    } catch (e) {
      console.warn("Failed to load saved expenses", e);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && active) {
        fetchTrackerData();
        loadSavedExpenses();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [fetchTrackerData, loadSavedExpenses]);

  // Re-fetch data whenever formDate changes
  useEffect(() => {
    fetchTrackerData();
    loadSavedExpenses();
  }, [formDate, fetchTrackerData, loadSavedExpenses]);


  const updateFinanceExtra = (dept: string, val: number) => {
    setFinanceExtras(prev => ({ ...prev, [dept]: val }));
    setJustUpdated(dept);
    setTimeout(() => setJustUpdated(null), 1000);
  };

  const recalculateExtras = (rows: any[]) => {
    const newExtras: Record<string, number> = {};
    // Initialize all department keys (including per-batch) to 0
    for (const dept of departmentList) newExtras[dept] = 0;

    rows.forEach(row => {
      // Normalize department selection
      let selectedDepts: string[] = [];
      if (Array.isArray(row.department)) {
        selectedDepts = row.department;
      } else if (row.department === 'All Departments') {
        selectedDepts = departmentList;
      } else if (row.department) {
        selectedDepts = [row.department];
      }
      
      if (selectedDepts.length > 0 && row.amount) {
        const share = row.amount / selectedDepts.length;
        selectedDepts.forEach((dept: string) => {
          // Normalize names for matching: ignore dash types and trimming
          const normalizedDept = dept.trim().replace(/[—–-]/g, '-');
          const match = departmentList.find(d => d.trim().replace(/[—–-]/g, '-') === normalizedDept);
          
          if (match) {
            newExtras[match] += share;
          } else if (dept in newExtras) {
            // Exact match fallback
            newExtras[dept] += share;
          }
        });
      }
    });

    setFinanceExtras(newExtras);
  };

  const addBizRow = () => {
    setBizRows(prev => [{ name: '', department: '', amount: 0 }, ...prev]);
    // Always jump to the first page when adding a new row at the top
    setBizPage(1);
  };

  const removeBizRow = (index: number) => {
    const updated = bizRows.filter((_, i) => i !== index);
    setBizRows(updated);
    recalculateExtras(updated);
  };

  const updateBizRow = (index: number, field: string, value: string | number) => {
    const updated = [...bizRows];
    const oldDept = updated[index].department;
    updated[index] = { ...updated[index], [field]: value };
    setBizRows(updated);
    recalculateExtras(updated);

    // Pulse feedback
    if (field === 'amount' || field === 'department') {
      const newD = updated[index].department;
      const selected = Array.isArray(newD) ? newD : (newD === 'All Departments' ? departmentList : (newD ? [newD] : []));
      
      selected.forEach((d: string) => {
        setJustUpdated(d);
        setTimeout(() => setJustUpdated(null), 1000);
      });

      const oldD = oldDept;
      const oldSelected = Array.isArray(oldD) ? oldD : (oldD === 'All Departments' ? departmentList : (oldD ? [oldD] : []));
      
      oldSelected.forEach((d: string) => {
        if (!selected.includes(d)) {
          setJustUpdated(d);
          setTimeout(() => setJustUpdated(null), 1000);
        }
      });
    }
  };

  // Deprecated handlers, replaced by updateBizRow
  const updateBizAmount = (index: number, val: number) => updateBizRow(index, 'amount', val);
  const updateBizField = (index: number, field: string, val: string) => updateBizRow(index, 'field', val);


  const saveDailyExpenses = async () => {
    if (savingDailyExpenses) return;
    try {
      setSavingDailyExpenses(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) return toast('Unauthorized', 'error');

      const payload = {
        date: formatDate(formDate),
        financeExtras,
        bizExpenses: bizRows.filter(e => e.name && e.amount > 0)
      };

      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save daily expenses');
      
      toast('✅ Daily expenses saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to save daily expenses.', 'error');
    } finally {
      setSavingDailyExpenses(false);
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!formDate) return toast('Date is required.', 'error');

    try {
      setSaving(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      // Calculate split for business expenses to distribute to departments in the summary sheet
      const bizSplit: Record<string, number> = {};
      // Initialize all department keys (including per-batch) to 0
      for (const dept of departmentList) bizSplit[dept] = 0;
      bizRows.forEach(exp => {
        const selectedDepts = Array.isArray(exp.department) 
          ? exp.department 
          : (exp.department === 'All Departments' ? departmentList : (exp.department ? [exp.department] : []));
        
        if (selectedDepts.length > 0) {
          const splitAmount = (exp.amount || 0) / selectedDepts.length;
          selectedDepts.forEach((dept: string) => {
            if (dept in bizSplit) {
              bizSplit[dept] += splitAmount;
            }
          });
        }
      });

      const payload = {
        date: formDate,
        eggFarmRevenue: efRev, 
        eggFarmExpenses: efExp,
        broilerRevenue: bfRev, 
        broilerExpenses: bfExp,
        kioskBatsindaRevenue: batRev, 
        kioskBatsindaExpenses: batExp,
        kioskNyabugogoRevenue: nyaRev, 
        kioskNyabugogoExpenses: nyaExp,
        butcherRevenue: buRev, 
        butcherExpenses: buExp,
      };

      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save manual entry');

      toast('✅ Finance summary saved successfully!', 'success');
      fetchTableData();
    } catch (err) {
      console.error(err);
      toast('Failed to save manual entry.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    // Columns match the table headers exactly
    const headers = [
      'Date',
      'EF Rev', 'EF Exp', 'EF Profit',
      'BF Rev', 'BF Exp', 'BF Profit',
      'KB Rev', 'KB Exp', 'KB Profit',
      'KN Rev', 'KN Exp', 'KN Profit',
      'BU Rev', 'BU Exp', 'BU Profit',
      'Total Rev', 'Total Exp', 'Net Profit'
    ];

    const rows = records.map(r => [
      r.date,
      r.eggFarmRevenue.toString(), r.eggFarmExpenses.toString(), r.eggFarmProfit.toString(),
      r.broilerRevenue.toString(), r.broilerExpenses.toString(), r.broilerProfit.toString(),
      r.kioskBatsindaRevenue.toString(), r.kioskBatsindaExpenses.toString(), r.kioskBatsindaProfit.toString(),
      r.kioskNyabugogoRevenue.toString(), r.kioskNyabugogoExpenses.toString(), r.kioskNyabugogoProfit.toString(),
      r.butcherRevenue.toString(), r.butcherExpenses.toString(), r.butcherProfit.toString(),
      r.totalRevenue.toString(), r.totalExpenses.toString(), r.netProfit.toString()
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `30plus-finance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Derive today's totals from the table records if in daily mode
  const todayRecord = records.find(r => r.date === todayStr);
  // UPDATED: Use live totalRev for top card real-time today, otherwise saved record
  const displayTotalRev = period === 'daily' ? totalRev : (todayRecord?.totalRevenue || 0);
  // UPDATED: Use grandTotalExpenses (Dept + Extras + Biz) for top card real-time
  const displayTotalExp = period === 'daily' ? grandTotalExpenses : (todayRecord?.totalExpenses || 0);
  const displayNetProfit = displayTotalRev - displayTotalExp;

  // UPDATED: Use live trackerData to count reported departments before saving
  const reportedCount = departmentList.reduce((count, dept) => trackerData[dept]?.submitted ? count + 1 : count, 0);

  // --- Visible Slices for Paging ---
  const visibleBizRows = bizRows.slice((bizPage - 1) * rowsPerPage, bizPage * rowsPerPage);
  const visibleHistory = records.slice((historyPage - 1) * rowsPerPage, historyPage * rowsPerPage);

  const bizTotalPages = Math.ceil(bizRows.length / rowsPerPage);
  const historyTotalPages = Math.ceil(records.length / rowsPerPage);

  return (
    <div className="space-y-8 pb-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B6B3A]">Finance — Summary Dashboard</h1>
          <p className="text-[#111827] opacity-70 text-base">Comprehensive business overview</p>
        </div>

        {/* Date Range Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('daily')}
            className={period === 'daily'
              ? 'bg-[#F5C518] text-[#2D2D2D] font-bold rounded-xl px-4 py-2 transition-colors'
              : 'border border-gray-200 bg-white text-gray-500 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors'}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={period === 'monthly'
              ? 'bg-[#F5C518] text-[#2D2D2D] font-bold rounded-xl px-4 py-2 transition-colors'
              : 'border border-gray-200 bg-white text-gray-500 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors'}
          >
            Monthly Overview
          </button>
        </div>
      </div>

      {period === 'monthly' && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
           {/* Year Tabs */}
           <div className="flex overflow-x-auto pb-2 mb-4 gap-3 scrollbar-none">
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

            {/* Month Tabs */}
            <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-none">
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => {
                const isSelected = selectedMonth === idx;
                const isFuture = selectedYear === new Date().getFullYear() && idx > new Date().getMonth();

                return (
                  <button
                    key={month}
                    disabled={isFuture}
                    onClick={() => setSelectedMonth(idx)}
                    className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all ${isSelected
                      ? 'bg-[#F5C518] text-[#2D2D2D] shadow-md scale-105'
                      : isFuture
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-[#F5C518] hover:text-[#F5C518]'
                      }`}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
        </div>
      )}


      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      {period === 'daily' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total revenue today" value={formatRWF(displayTotalRev)} icon={<RevenueIcon />} className="border-l-4 border-[#1B6B3A]" />
          <StatCard title="Total expenses today" value={formatRWF(displayTotalExp)} icon={<ExpenseIcon />} className="border-l-4 border-[#F5C518]" />
          <StatCard title="Net profit today" value={formatRWF(displayNetProfit)} icon={<ProfitIcon />} className={`border-l-4 ${displayNetProfit >= 0 ? 'border-[#1B6B3A]' : 'border-[#D9534F]'}`} />
          <StatCard title="Departments reported" value={`${reportedCount} / 5`} icon={<DocumentIcon />} className="border-l-4 border-[#E07B00]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Monthly revenue" value={formatRWF(monthlyStats.monthlyRevenue)} icon={<RevenueIcon />} className="border-l-4 border-[#1B6B3A]" />
          <StatCard title="Monthly expenses" value={formatRWF(monthlyStats.monthlyExpenses)} icon={<ExpenseIcon />} className="border-l-4 border-[#F5C518]" />
          <StatCard title="Monthly profit" value={formatRWF(monthlyStats.monthlyProfit)} icon={<ProfitIcon />} className={`border-l-4 ${monthlyStats.monthlyProfit >= 0 ? 'border-[#1B6B3A]' : 'border-[#D9534F]'}`} />
          <StatCard title="Days recorded" value={monthlyStats.daysRecorded.toString()} icon={<DocumentIcon />} className="border-l-4 border-[#E07B00]" />
        </div>
      )}

      {/* ── Main Content — Context Dependent ───────────────────────────── */}
      {period === 'daily' ? (
        <Card className="border-0 shadow-xl overflow-hidden mt-8">
          <div className="bg-[#1B6B3A] p-6 text-white flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Daily expenses tracker</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/70 font-medium">Reporting for:</span>
              <input 
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="bg-white/20 text-white border border-white/30 rounded-xl px-4 py-2 text-sm font-bold font-mono outline-none focus:bg-white/30 transition"
              />
            </div>
          </div>

          <CardContent className="p-6 bg-white space-y-8">
            {/* Legend */}
            <div className="flex gap-3">
              <button 
                onClick={() => fetchTrackerData(true)}
                disabled={loadingTracker}
                className={`text-xs font-bold px-3 py-1 rounded-full transition shadow-sm flex items-center gap-2 
                  ${loadingTracker 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-[#EAF5EE] text-[#1B6B3A] hover:bg-[#1B6B3A] hover:text-white'}`}
              >
                {loadingTracker ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Pulling data...
                  </>
                ) : (
                  <>
                    Auto-pulled from departments
                    <span className="text-[10px] opacity-70">🔄 Force Pull</span>
                  </>
                )}
              </button>
              <span className="bg-[#FFF8E1] text-[#E07B00] text-xs font-bold px-3 py-1 rounded-full">
                Finance adds here
              </span>
            </div>

            {/* PART 1 — Department Expenses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-xs text-gray-400 uppercase tracking-wide text-left py-2">Department</th>
                    <th className="text-xs text-gray-400 uppercase tracking-wide text-right py-2">Dept expenses (auto)</th>
                    <th className="text-xs text-gray-400 uppercase tracking-wide text-right py-2">Finance extra</th>
                    <th className="text-xs text-gray-400 uppercase tracking-wide text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentList.map(dept => {
                    const autoPulled = trackerData[dept]?.value || 0;
                    const isSubmitted = trackerData[dept]?.submitted || false;
                    const financeExtra = financeExtras[dept] || 0;

                    return (
                      <tr key={dept} className="border-b border-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: departmentColors[dept] }} />
                            <span className="text-sm font-semibold text-[#2D2D2D]">{dept}</span>
                            {dept.startsWith('Broiler —') && (
                              <span className="text-[9px] bg-[#FFF8E1] text-[#E07B00] px-2 py-0.5 rounded-full font-bold uppercase">Batch</span>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3">
                          <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono inline-block min-w-[100px]">
                            {!isSubmitted ? 'Not submitted' : formatRWF(autoPulled)}
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">
                          <div className={`border-2 rounded-lg px-3 py-2 text-xs text-right w-28 transition-all duration-300 font-mono font-bold
                            ${justUpdated === dept 
                              ? 'bg-[#F5C518]/20 border-[#F5C518] scale-105' 
                              : 'bg-[#FFF8E1] border-[#F5C518]'}`}>
                            {formatRWF(financeExtra)}
                          </div>
                        </td>
                        <td className="text-right py-3">
                          <div className="bg-[#FFF8E1] border-2 border-[#F5C518] rounded-lg px-3 py-2 text-xs font-bold font-mono text-[#2D2D2D] inline-block min-w-[100px]">
                            {formatRWF(autoPulled + financeExtra)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* GRAND TOTAL ROW */}
                  <tr className="bg-[#EAF5EE] rounded-xl">
                    <td className="font-bold text-[#1B6B3A] text-sm py-3 px-2 rounded-l-xl">Total</td>
                    <td className="text-right font-bold text-[#1B6B3A] font-mono text-sm px-2">
                      {formatRWF(departmentList.reduce((s, d) => s + (trackerData[d]?.value || 0), 0))}
                    </td>
                    <td className="text-right font-bold text-[#E07B00] font-mono text-sm px-2">
                      {formatRWF(totalBizExpenses)}
                    </td>
                    <td className="text-right font-bold text-[#1B6B3A] font-mono text-sm px-2 rounded-r-xl">
                      {formatRWF(totalDeptExpenses + totalBizExpenses)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PART 2 — Business Expenses Section */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-sm font-bold text-[#2D2D2D]">Business expenses (finance only)</h3>
                <button 
                  onClick={addBizRow}
                  className="bg-[#F5C518] text-[#2D2D2D] rounded-xl px-4 py-2 text-xs font-bold hover:bg-[#E07B00] hover:text-white transition"
                >
                  + Add expense
                </button>
              </div>

              {visibleBizRows.map((row, i) => {
                const actualIndex = (bizPage - 1) * rowsPerPage + i;
                return (
                  <BizExpenseRow 
                    key={actualIndex} 
                    row={row} 
                    index={actualIndex} 
                    onUpdate={updateBizRow}
                    onRemove={removeBizRow}
                    batches={batches}
                  />
                );
              })}

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Page {bizPage} of {bizTotalPages || 1} ({bizRows.length} total)
                </span>
                <div className="flex gap-2">
                  {bizPage > 1 && (
                    <button
                      onClick={() => setBizPage(prev => Math.max(1, prev - 1))}
                      className="text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                      Previous
                    </button>
                  )}
                  {bizPage < bizTotalPages && (
                    <button
                      onClick={() => setBizPage(prev => Math.min(bizTotalPages, prev + 1))}
                      className="text-xs text-[#1B6B3A] border border-[#1B6B3A] rounded-lg px-3 py-1.5 hover:bg-[#EAF5EE] transition">
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* PART 3 — Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-[#EAF5EE] rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Dept expenses</p>
                <p className="text-lg font-bold text-[#1B6B3A] font-mono">
                  {formatRWF(totalDeptExpenses)}
                </p>
              </div>
              <div className="bg-[#FFF3E0] rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Business expenses</p>
                <p className="text-lg font-bold text-[#E07B00] font-mono">
                  {formatRWF(totalBizExpenses)}
                </p>
              </div>
              <div className="bg-[#FFF8E1] rounded-2xl p-4 border-2 border-[#F5C518]">
                <p className="text-xs text-gray-400 mb-1">Grand total expenses</p>
                <p className="text-xl font-bold text-[#2D2D2D] font-mono">
                  {formatRWF(grandTotalExpenses)}
                </p>
              </div>
            </div>

            {/* PART 4 — Save Button */}
            <button 
              onClick={saveDailyExpenses}
              disabled={savingDailyExpenses}
              className="w-full bg-[#1B6B3A] text-white rounded-2xl py-4 text-sm font-bold hover:bg-[#164F2C] transition flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {savingDailyExpenses ? 'Saving...' : 'Save Daily Expenses'}
            </button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-xl overflow-hidden mt-8">
          <div className="bg-[#1B6B3A] p-6 text-white">
            <CardTitle className="text-xl">Monthly Performance — Department Breakdown</CardTitle>
            <CardDescription className="text-white/80">Aggregated performance data for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardDescription>
          </div>
          <CardContent className="p-0 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-400 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="p-4 font-semibold">Department</th>
                    <th className="p-4 font-semibold">Revenue</th>
                    <th className="p-4 font-semibold">Expenses</th>
                    <th className="p-4 font-semibold">Profit</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(() => {
                    // Static departments
                    const staticDepts = [
                      { name: 'Egg Farm', color: '#1B6B3A', revKey: 'eggFarmRevenue', expKey: 'eggFarmExpenses', profKey: 'eggFarmProfit' },
                      { name: 'Kiosk Batsinda', color: '#F5C518', revKey: 'kioskBatsindaRevenue', expKey: 'kioskBatsindaExpenses', profKey: 'kioskBatsindaProfit' },
                      { name: 'Kiosk Nyabugogo', color: '#E07B00', revKey: 'kioskNyabugogoRevenue', expKey: 'kioskNyabugogoExpenses', profKey: 'kioskNyabugogoProfit' },
                      { name: 'Butchery', color: '#2D2D2D', revKey: 'butcherRevenue', expKey: 'butcherExpenses', profKey: 'butcherProfit' },
                    ];

                    // Per-batch broiler rows
                    const batchDeptRows = batches.map(bname => ({
                      name: `Broiler — ${bname}`,
                      color: '#E07B00',
                      revKey: `broiler_${bname}_revenue`,
                      expKey: `broiler_${bname}_expenses`,
                      profKey: `broiler_${bname}_profit`,
                      isBatch: true,
                    }));

                    const allDepts = [
                      staticDepts[0], // Egg Farm
                      ...batchDeptRows,
                      staticDepts[1], staticDepts[2], staticDepts[3],
                    ];

                    return allDepts.map((dept, i) => {
                      let rev = 0, exp = 0, prof = 0;
                      for (const r of records) {
                        rev += Number((r as any)[dept.revKey]) || 0;
                        exp += Number((r as any)[dept.expKey]) || 0;
                        prof += Number((r as any)[dept.profKey]) || 0;
                      }
                      return (
                        <tr key={dept.name} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-50 transition-colors`}>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                              <span className="font-bold text-[#2D2D2D]">{dept.name}</span>
                              {(dept as any).isBatch && (
                                <span className="text-[9px] bg-[#FFF8E1] text-[#E07B00] px-2 py-0.5 rounded-full font-bold uppercase">Batch</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-mono font-semibold text-gray-700">{formatRWF(rev)}</td>
                          <td className="p-4 font-mono font-semibold text-gray-700">{formatRWF(exp)}</td>
                          <td className={`p-4 font-mono font-bold ${prof >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}`}>
                            {formatRWF(prof)}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                              prof >= 0 ? 'bg-[#EAF5EE] text-[#1B6B3A]' : 'bg-red-50 text-[#D9534F]'
                            }`}>
                              {prof >= 0 ? 'Profit' : 'Loss'}
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                  {(!monthlyDeptTotals || monthlyDeptTotals.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-400 italic">
                        No financial records found for this month yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Historical Records Table ─────────────────────────────────── */}
      <Card className="overflow-hidden border-0 shadow-lg mt-8">
        <div className="flex justify-between items-center p-5 bg-white border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#2D2D2D]">Historical Records</h2>
          <Button onClick={exportCSV} variant="outline" className="text-sm h-9 border-gray-200">
            Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              {/* Row 1: Group Headers */}
              <tr>
                <th rowSpan={2} className="bg-gray-50 text-gray-600 font-semibold p-3 border-b border-r min-w-[100px] align-bottom">Date</th>
                <th colSpan={3} className="bg-[#1B6B3A] text-white text-center font-bold p-2 border-r border-[#164F2C]">Egg Farm</th>
                {/* One group header per batch */}
                {batches.map(bname => (
                  <th key={bname} colSpan={3} className="bg-[#E07B00] text-white text-center font-bold p-2 border-r border-[#b36200] whitespace-nowrap">
                    Broiler — {bname}
                  </th>
                ))}
                <th colSpan={3} className="bg-[#F5C518] text-[#2D2D2D] text-center font-bold p-2 border-r border-[#d9ad15]">Kiosk Batsinda</th>
                <th colSpan={3} className="bg-yellow-600 text-white text-center font-bold p-2 border-r border-yellow-700">Kiosk Nyabugogo</th>
                <th colSpan={3} className="bg-[#2D2D2D] text-white text-center font-bold p-2 border-r border-[#1a1a1a]">Butchery</th>
                <th colSpan={3} className="bg-[#164F2C] text-white text-center font-bold p-2">Overall</th>
              </tr>
              {/* Row 2: Sub Headers */}
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                {/* EF */}
                <th className="p-2 border-b font-medium">Rev</th>
                <th className="p-2 border-b font-medium">Exp</th>
                <th className="p-2 border-b border-r font-medium text-black">Profit</th>
                {/* Per-batch Broiler sub-headers */}
                {batches.map(bname => (
                  <React.Fragment key={bname}>
                    <th className="p-2 border-b font-medium">Rev</th>
                    <th className="p-2 border-b font-medium">Exp</th>
                    <th className="p-2 border-b border-r font-medium text-black">Profit</th>
                  </React.Fragment>
                ))}
                {/* KB */}
                <th className="p-2 border-b font-medium">Rev</th>
                <th className="p-2 border-b font-medium">Exp</th>
                <th className="p-2 border-b border-r font-medium text-black">Profit</th>
                {/* KN */}
                <th className="p-2 border-b font-medium">Rev</th>
                <th className="p-2 border-b font-medium">Exp</th>
                <th className="p-2 border-b border-r font-medium text-black">Profit</th>
                {/* BU */}
                <th className="p-2 border-b font-medium">Rev</th>
                <th className="p-2 border-b font-medium">Exp</th>
                <th className="p-2 border-b border-r font-medium text-black">Profit</th>
                {/* Overall */}
                <th className="p-2 border-b font-medium text-[#1B6B3A]">Total Rev</th>
                <th className="p-2 border-b font-medium text-[#E07B00]">Total Exp</th>
                <th className="p-2 border-b font-bold text-black">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // 1 (date) + 3 (EF) + 3*batches + 3 (KB) + 3 (KN) + 3 (BU) + 3 (overall)
                const totalCols = 1 + 3 + (batches.length * 3) + 3 + 3 + 3 + 3;
                if (loadingTable) return (
                  <tr><td colSpan={totalCols} className="text-center p-8 text-gray-400">Loading records...</td></tr>
                );
                if (records.length === 0) return (
                  <tr><td colSpan={totalCols} className="text-center p-8 text-gray-400 bg-white">No records found for this period.</td></tr>
                );
                return visibleHistory.map((r, i) => (
                  <HistoryRow key={i} row={r} batches={batches} />
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Pagination Logic */}
        <div className="flex justify-between items-center p-3 bg-white border-t border-gray-100">
          <span className="text-xs text-gray-400 pl-2">
            Page {historyPage} of {historyTotalPages || 1} ({records.length} total)
          </span>
          <div className="flex gap-2 pr-2">
            {historyPage > 1 && (
              <button
                type="button"
                onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                className="text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                Previous
              </button>
            )}
            {historyPage < historyTotalPages && (
              <button
                type="button"
                onClick={() => setHistoryPage(prev => Math.min(historyTotalPages, prev + 1))}
                className="text-xs text-[#1B6B3A] border border-[#1B6B3A] rounded-lg px-3 py-1.5 hover:bg-[#EAF5EE] transition">
                Next
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* ── Manual Entry Form — Only in Daily Mode ──────────────────────── */}
      {period === 'daily' && (
        <Card className="border-0 shadow-xl overflow-hidden mt-8">
          <div className="bg-[#1B6B3A] p-6 text-white">
            <CardTitle className="text-xl">Manual Entry / Adjustment Form</CardTitle>
            <CardDescription className="text-[#EAF5EE] opacity-90 mt-1">
              Data is auto-pulled for the selected date. Adjust values manually to correct any missing or incorrect department entries.
            </CardDescription>
          </div>

          <CardContent className="p-6 bg-white">
            <form onSubmit={handleManualSave} className="space-y-6">

              {/* Form Top Actions */}
              <div className="flex items-end gap-4 pb-4 border-b border-gray-100">
                <div className="w-48">
                  <Input
                    label="Report Date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => autoPullData(formDate)}
                  isLoading={loadingAutoPull}
                  className="mb-1"
                >
                  Pull Data for Date
                </Button>
              </div>

              {/* Visual Hint */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                <span className="text-blue-400 text-sm">ℹ</span>
                <p className="text-xs text-blue-600">
                  Total expenses are automatically pulled from the Daily Expenses Tracker below. 
                  Add expenses there to update this value.
                </p>
              </div>

              {/* Matrix Form */}
              <div className="grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 pt-2">

                {/* Egg Farm Col */}
                <div className="space-y-4 p-4 rounded-xl border border-gray-100 bg-[#EAF5EE]/20">
                  <h3 className="font-bold text-[#1B6B3A] border-b pb-2">Egg Farm</h3>
                  <Input
                    label="Revenue" type="number" min="0"
                    value={fields.eggFarmRevenue}
                    onChange={(e) => setFields({ ...fields, eggFarmRevenue: e.target.value })}
                  />
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Expenses</p>
                    <p className="font-mono text-sm text-gray-500">{formatRWF(efExp)}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Profit</p>
                    <p className={`font-mono text-lg ${profitTextColor(efProfit)}`}>{efProfit.toLocaleString()}</p>
                  </div>
                </div>

                {/* Per-Batch Broiler Cols (dynamic) */}
                {batches.map(bname => {
                  const batchKey = `Broiler — ${bname}`;
                  const batchRev = Number(fields[`broiler_${bname}_revenue` as keyof typeof fields]) || 0;
                  const batchExp = trackerData[batchKey]?.value || 0;
                  const batchProfit = batchRev - batchExp;
                  return (
                    <div key={bname} className="space-y-4 p-4 rounded-xl border border-[#E07B00]/30 bg-orange-50/30">
                      <div className="border-b pb-2 flex items-center gap-2">
                        <h3 className="font-bold text-[#E07B00]">Broiler</h3>
                        <span className="text-[9px] bg-[#FFF8E1] text-[#E07B00] px-2 py-0.5 rounded-full font-bold uppercase">{bname}</span>
                      </div>
                      <Input
                        label="Revenue" type="number" min="0"
                        value={fields[`broiler_${bname}_revenue` as keyof typeof fields] || ''}
                        onChange={(e) => setFields({ ...fields, [`broiler_${bname}_revenue`]: e.target.value } as any)}
                      />
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-400 uppercase font-semibold">Expenses</p>
                        <p className="font-mono text-sm text-gray-500">{formatRWF(batchExp)}</p>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Profit</p>
                        <p className={`font-mono text-lg ${profitTextColor(batchProfit)}`}>{batchProfit.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Kiosk Batsinda */}
                <div className="space-y-4 p-4 rounded-xl border border-gray-100 bg-yellow-50/50">
                  <h3 className="font-bold text-[#D9AD15] border-b pb-2">Kiosk Batsinda</h3>
                  <Input
                    label="Revenue" type="number" min="0"
                    value={fields.kioskBatsindaRevenue}
                    onChange={(e) => setFields({ ...fields, kioskBatsindaRevenue: e.target.value })}
                  />
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Expenses</p>
                    <p className="font-mono text-sm text-gray-500">{formatRWF(batExp)}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Profit</p>
                    <p className={`font-mono text-lg ${profitTextColor(batProfit)}`}>{batProfit.toLocaleString()}</p>
                  </div>
                </div>

                {/* Kiosk Nyabugogo */}
                <div className="space-y-4 p-4 rounded-xl border border-gray-100 bg-yellow-50/50">
                  <h3 className="font-bold text-[#E07B00] border-b pb-2">Kiosk Nyabugogo</h3>
                  <Input
                    label="Revenue" type="number" min="0"
                    value={fields.kioskNyabugogoRevenue}
                    onChange={(e) => setFields({ ...fields, kioskNyabugogoRevenue: e.target.value })}
                  />
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Expenses</p>
                    <p className="font-mono text-sm text-gray-500">{formatRWF(nyaExp)}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Profit</p>
                    <p className={`font-mono text-lg ${profitTextColor(nyaProfit)}`}>{nyaProfit.toLocaleString()}</p>
                  </div>
                </div>

                {/* Butchery Col */}
                <div className="space-y-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-[#2D2D2D] border-b pb-2">Butchery</h3>
                  <Input
                    label="Revenue" type="number" min="0"
                    value={fields.butcherRevenue}
                    onChange={(e) => setFields({ ...fields, butcherRevenue: e.target.value })}
                  />
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-400 uppercase font-semibold">Expenses</p>
                    <p className="font-mono text-sm text-gray-500">{formatRWF(buExp)}</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Profit</p>
                    <p className={`font-mono text-lg ${profitTextColor(buProfit)}`}>{buProfit.toLocaleString()}</p>
                  </div>
                </div>

              </div>

              {/* ── Auto-Calculated Totals Row ────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                <div className="bg-[#EAF5EE] border-2 border-[#1B6B3A] rounded-xl p-4 flex flex-col justify-center">
                  <label className="text-xs font-semibold text-[#1B6B3A]">Total Revenue Today</label>
                  <p className="text-3xl font-bold text-[#2D2D2D] font-mono mt-1">{totalRev.toLocaleString()}</p>
                </div>

                <div className="bg-[#FFF8E1] border-2 border-[#F5C518] rounded-xl p-4 flex justify-between items-center lg:col-span-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 block mb-1">
                      Total Expenses (RWF)
                    </p>
                    <p className="text-2xl font-bold text-[#2D2D2D] font-mono">
                      {formatRWF(grandTotalExpenses)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Auto-pulled from Daily Expenses Tracker
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Dept expenses</p>
                    <p className="text-sm font-semibold text-[#1B6B3A]">{formatRWF(totalDeptExpenses)}</p>
                    <p className="text-xs text-gray-400 mt-1">Finance expenses</p>
                    <p className="text-sm font-semibold text-[#E07B00]">{formatRWF(totalBizExpenses)}</p>
                  </div>
                </div>
              </div>

              <div className={`border-2 rounded-xl p-4 flex flex-col justify-center ${netProfitCalc >= 0 ? 'bg-[#EAF5EE] border-[#1B6B3A]' : 'bg-red-50 border-[#D9534F]'
                  }`}
                >
                  <label className="text-sm font-semibold text-gray-800">Final Net Profit Today</label>
                  <p className={`text-3xl font-bold font-mono mt-1 ${netProfitCalc >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'
                    }`}
                  >
                    {formatRWF(netProfitCalc)}
                  </p>
                </div>

              {/* Submit Action */}
              <div className="pt-4 flex justify-end">
                <Button type="submit" size="lg" className="px-8 text-base shadow-lg" isLoading={saving}>
                  Save Finance Summary
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
