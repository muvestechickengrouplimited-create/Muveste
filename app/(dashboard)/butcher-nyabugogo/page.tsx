'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ButcherNyabugogoForm from '@/components/forms/ButcherNyabugogoForm';
import { StatCard } from '../../../components/ui/StatCard';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../../components/ui/Table';
import { formatRWF, formatDate } from '../../../lib/utils';
import { auth } from '../../../lib/firebase';

// ─── Types ──────────────────────────────────────────────────────────────────
interface butcherRecord {
  date: string;
  meatReceived: number;
  meatSold: number;
  pricePerKg: number;
  damaged: number;
  stockLeft: number;
  expenses: number;
  totalSales: number;
  profit: number;
  notes: string;
  submittedBy: string;
  timestamp: string;
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const MeatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const SalesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ProfitIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const DamagedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── Page ────────────────────────────────────────────────────────────────────
// ─── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-[#e8f5e8] rounded-xl ${className}`} />
);

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ButcherNyabugogoDashboard() {
  const [records, setRecords] = useState<butcherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fetchRecords = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      setLoading(true);
      setError(null);

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setError('Not authenticated. Please refresh the page.');
        return;
      }

      const res = await fetch('/api/butcher-nyabugogo', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to load records');
        return;
      }

      const data = await res.json();
      setRecords(data.data || []);
    } catch (err) {
      clearTimeout(timeout);
      console.error('Failed to fetch butcher records:', err);
      setError('Failed to load records. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ── Derive today's totals ───────────────────────────────────────────────
  const todayRecords = records.filter((r) => r.date === todayStr);
  const todayMeatSold = todayRecords.reduce((s, r) => s + r.meatSold, 0);
  const todaySales = todayRecords.reduce((s, r) => s + r.totalSales, 0);
  const todayProfit = todayRecords.reduce((s, r) => s + r.profit, 0);
  const todayDamaged = todayRecords.reduce((s, r) => s + r.damaged, 0);

  // ── Recent 7 days ───────────────────────────────────────────────────────
  const cutoff7 = new Date();
  cutoff7.setDate(cutoff7.getDate() - 7);
  const recent7 = records
    .filter((r) => new Date(r.date) >= cutoff7)
    .slice(0, 20);

  return (
    <>
      <div className="hidden md:block">
        <div className="space-y-8 pb-8 px-4 py-4 md:px-8 md:py-6">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-[#1B6B3A]">
              Butchery — Nyabugogo
            </h1>
            <p className="text-[#111827] opacity-70 text-base">{todayLabel}</p>
          </div>

          {/* ── Error Boundaries ───────────────────────────────────────────── */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center animate-in fade-in duration-300">
              <p className="text-sm text-red-500 mb-3">
                Failed to load data
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#006400] text-white rounded-lg px-4 py-2 text-xs font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {/* ── Summary Cards ──────────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[1,2,3,4].map(i => (
                <Skeleton key={i} className="h-28"/>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Meat sold today"
                value={`${todayMeatSold.toFixed(2)} kg`}
                icon={<MeatIcon />}
                className="border-l-4 border-[#1B6B3A]"
              />
              <StatCard
                title="Total sales"
                value={formatRWF(todaySales)}
                icon={<SalesIcon />}
                className="border-l-4 border-[#F5C518]"
              />
              <StatCard
                title="Profit today"
                value={formatRWF(todayProfit)}
                icon={<ProfitIcon />}
                className={`border-l-4 ${todayProfit >= 0 ? 'border-[#1B6B3A]' : 'border-[#D9534F]'}`}
              />
              <StatCard
                title="Damaged today"
                value={`${todayDamaged.toFixed(2)} kg`}
                icon={<DamagedIcon />}
                className="border-l-4 border-[#E07B00]"
              />
            </div>
          )}

          {/* ── Main Content: Form (60%) + Table (40%) ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

            {/* Form — 60% */}
            <div className="lg:col-span-3">
              <ButcherNyabugogoForm />
            </div>

            {/* Recent Submissions Table — 40% */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-semibold text-[#111827]">
                  Recent Submissions{' '}
                  <span className="text-xs font-normal text-gray-400 ml-1">(last 7 days)</span>
                </h2>
                <button
                  onClick={fetchRecords}
                  className="text-xs text-[#1B6B3A] hover:underline font-medium"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B6B3A] border-t-transparent" />
                    <p className="text-sm text-gray-400">Loading records…</p>
                  </div>
                </div>
              ) : recent7.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.07)] py-12 flex flex-col items-center gap-2">
                  <span className="text-4xl">🥩</span>
                  <p className="text-sm text-gray-400">No submissions in the last 7 days.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="min-w-[600px] px-4 md:px-0 md:min-w-0">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Meat Sold</TableHead>
                          <TableHead>Price/kg</TableHead>
                          <TableHead>Total Sales</TableHead>
                          <TableHead>Stock Left</TableHead>
                          <TableHead>Butcher Exp</TableHead>
                          <TableHead>Net Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recent7.map((record, idx) => (
                          <TableRow key={`${record.date}-${idx}`}>
                            <TableCell className="whitespace-nowrap font-medium">
                              {formatDate(record.date)}
                            </TableCell>
                            <TableCell className="font-mono">
                              {record.meatSold.toFixed(2)} kg
                            </TableCell>
                            <TableCell className="font-mono text-gray-600">
                              {record.pricePerKg.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-mono text-[#E07B00] font-semibold">
                              {formatRWF(record.totalSales)}
                            </TableCell>
                            <TableCell className="font-mono text-blue-600">
                              {record.stockLeft.toFixed(2)} kg
                            </TableCell>
                            <TableCell className="font-mono text-gray-500">
                              {formatRWF(record.expenses)}
                            </TableCell>
                            <TableCell
                              className={`font-mono font-semibold ${record.profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'
                                }`}
                            >
                              {formatRWF(record.profit)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="block md:hidden">
        <ButcherNyabugogoMobile />
      </div>
    </>
  );
}

// ─── Mobile Component ───────────────────────────────────────────────────────
function ButcherNyabugogoMobile() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const MEMORY_KEY = 'butcherMobileLastSubmitted';

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Field states
  const [meatReceived, setMeatReceived] = useState('');
  const [meatSold, setMeatSold] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [damaged, setDamaged] = useState('');
  const [expenses, setExpenses] = useState('');
  const [notes, setNotes] = useState('');
  const [previousStock, setPreviousStock] = useState(0);
  const [stockLeft, setStockLeft] = useState(0);

  // Restore from localStorage (removed to prevent stale data)
  useEffect(() => {
    // Only API pre-fetching is used now
  }, []);

  // Fetch previous stock 
  useEffect(() => {
    async function fetchPreviousStock() {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;
        const res = await fetch('/api/butcher-nyabugogo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
             setPreviousStock(Number(json.data[0].stockLeft) || 0);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch previous stock', err);
      }
    }
    fetchPreviousStock();
  }, []);

  const totalSales = (Number(meatSold) || 0) * (Number(pricePerKg) || 0);
  const profit = totalSales - (Number(expenses) || 0);

  useEffect(() => {
    const left = previousStock + (Number(meatReceived) || 0) - (Number(meatSold) || 0) - (Number(damaged) || 0);
    setStockLeft(left);
  }, [meatReceived, meatSold, damaged, previousStock]);

  const resetForm = () => {
    setMeatReceived(''); setMeatSold(''); setPricePerKg('');
    setDamaged(''); setExpenses(''); setNotes('');
    setSubmitted(false); setCurrentStep(1);
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!meatReceived || !meatSold || !pricePerKg)
        return alert('Please fill required fields (Received, Sold, Price)');
    }
    if (currentStep === 2) {
      if (!damaged || !expenses)
        return alert('Please fill required fields (Damaged, Expenses)');
    }
    setCurrentStep((s) => s + 1);
  };
  const prevStep = () => setCurrentStep((s) => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const payload = {
        date: selectedDate,
        meatReceived: Number(meatReceived),
        meatSold: Number(meatSold),
        pricePerKg: Number(pricePerKg),
        damaged: Number(damaged),
        expenses: Number(expenses),
        notes,
      };

      const res = await fetch('/api/butcher-nyabugogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to submit report');
      
      // Also re-fetch the latest stock 
      try {
        const fetchRes = await fetch('/api/butcher-nyabugogo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (fetchRes.ok) {
          const json = await fetchRes.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
             setPreviousStock(Number(json.data[0].stockLeft) || 0);
          }
        }
      } catch (err) {
        console.warn('Failed to update stock after submit', err);
      }

      setSubmitted(true);
      router.refresh();
    } catch (err) {
      alert('Error submitting report.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = currentStep === 1 ? 'Stock figures' : currentStep === 2 ? 'Expenses & damage' : 'Notes & submit';

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-gray-50">
        <div className="w-16 h-16 bg-[#EAF5EE] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#1B6B3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[#2D2D2D] mb-2">Report Submitted!</h3>
        <p className="text-sm text-gray-400 mb-6">Your daily report has been saved successfully.</p>
        <button onClick={resetForm} className="bg-[#1B6B3A] text-white rounded-2xl px-8 py-3 text-sm font-bold active:scale-95 transition-transform">
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#1B6B3A] px-4 py-3 flex items-center justify-between">
        <a href="/dashboard" className="text-[#9FE1CB] text-xs flex items-center gap-1">
          ← Back
        </a>
        <span className="text-white text-sm font-semibold">Butchery Report</span>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)} 
          className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 outline-none"
        />
      </div>

      <div className="bg-[#164F2C] px-4 py-3">
        <p className="text-[#9FE1CB] text-xs font-bold tracking-wide mb-2">DAILY REPORT PROGRESS</p>
        <div className="bg-white/15 rounded-full h-1">
          <div className="bg-[#F5C518] rounded-full h-1 transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
        </div>
        <p className="text-white/50 text-xs mt-1">Step {currentStep} of {totalSteps} — {stepTitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#F5C518]" />
          <span className="text-sm font-bold text-[#2D2D2D]">Step {currentStep}: {stepTitle}</span>
        </div>

        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 block">Meat Received (kg) <span className="text-[#E07B00]">*</span></label>
                <input required type="number" min="0" step="0.01" value={meatReceived} onChange={e => setMeatReceived(e.target.value)} className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-[#2D2D2D] outline-none focus:border-[#F5C518] focus:ring-2 focus:ring-[#F5C518]/20 min-h-[48px]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 block">Meat Sold (kg) <span className="text-[#E07B00]">*</span></label>
                <input required type="number" min="0" step="0.01" value={meatSold} onChange={e => setMeatSold(e.target.value)} className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-[#2D2D2D] outline-none focus:border-[#F5C518] focus:ring-2 focus:ring-[#F5C518]/20 min-h-[48px]" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 block">Price Per kg (RWF) <span className="text-[#E07B00]">*</span></label>
              <input required type="number" min="0" value={pricePerKg} onChange={e => setPricePerKg(e.target.value)} className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-[#2D2D2D] outline-none focus:border-[#F5C518] focus:ring-2 focus:ring-[#F5C518]/20 min-h-[48px]" />
            </div>
            <button type="button" onClick={nextStep} className="w-full mt-4 bg-[#F5C518] text-[#2D2D2D] rounded-2xl py-4 text-sm font-bold active:scale-95 transition-transform">Next →</button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 block">Damaged (kg) <span className="text-[#E07B00]">*</span></label>
                <input required type="number" min="0" step="0.01" value={damaged} onChange={e => setDamaged(e.target.value)} className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-[#2D2D2D] outline-none focus:border-[#F5C518] focus:ring-2 focus:ring-[#F5C518]/20 min-h-[48px]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 block">Expenses (RWF) <span className="text-[#E07B00]">*</span></label>
                <input required type="number" min="0" step="100" value={expenses} onChange={e => setExpenses(e.target.value)} className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-[#2D2D2D] outline-none focus:border-[#F5C518] focus:ring-2 focus:ring-[#F5C518]/20 min-h-[48px]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#FFF8E1] border-2 border-[#F5C518] rounded-2xl p-3">
                <p className="text-[10px] font-bold text-[#E07B00] tracking-wide mb-1 uppercase">Total Sales</p>
                <p className="text-lg font-bold text-[#2D2D2D] tabular-nums">RWF {totalSales.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-3">
                <p className="text-[10px] font-bold text-blue-600 tracking-wide mb-1 uppercase">Stock Left</p>
                <p className="text-lg font-bold text-[#2D2D2D] tabular-nums">{stockLeft.toFixed(2)} kg</p>
                <p className="text-[9px] text-gray-500 mt-0.5">Incl. {previousStock.toFixed(2)}kg prev. stock</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button type="button" onClick={nextStep} className="w-full bg-[#F5C518] text-[#2D2D2D] rounded-2xl py-4 text-sm font-bold active:scale-95 transition-transform">Next →</button>
              <button type="button" onClick={prevStep} className="w-full bg-white border-2 border-gray-200 text-gray-500 rounded-2xl py-3 text-sm font-semibold mt-2 active:scale-95 transition-transform">← Back</button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 block">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 text-sm text-[#2D2D2D] outline-none focus:border-[#F5C518] focus:ring-2 focus:ring-[#F5C518]/20" />
            </div>

            <div className={`rounded-2xl p-4 border-2 ${profit >= 0 ? 'bg-[#EAF5EE] border-[#1B6B3A]' : 'bg-red-50 border-[#D9534F]'}`}>
              <p className={`text-xs font-bold tracking-wide mb-1 ${profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}`}>DAILY PROFIT</p>
              <p className={`text-2xl font-bold tabular-nums ${profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}`}>
                RWF {profit.toLocaleString()}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button type="submit" disabled={loading} className="w-full bg-[#1B6B3A] text-white rounded-2xl py-4 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
              <button type="button" onClick={prevStep} className="w-full bg-white border-2 border-gray-200 text-gray-500 rounded-2xl py-3 text-sm font-semibold mt-2 active:scale-95 transition-transform">← Back</button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
