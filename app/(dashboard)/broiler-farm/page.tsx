'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BroilerFarmForm } from '../../../components/forms/BroilerFarmForm';
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
interface BroilerFarmRecord {
  date: string;
  batch: string;
  feedQty: number;
  price: number; // feed price
  water: number;
  medications: string;
  numberOfBirds: number;
  mortality: number;
  birdsSold: number;
  liveBirds: number;
  avgWeight: number;
  kgsSold: number;
  totalWeight: number;
  pricePerKg: number;
  expenses: number;
  revenue: number;
  profit: number;
  submittedBy: string;
  timestamp: string;
}

// ─── Icons ──────────────────────────────────────────────────────────────────
const BirdIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 19c-4.418 0-8-2.686-8-6 0-2.21 1.343-4.14 3.343-5.25A5 5 0 0117 10c1.5.5 3 1.75 3 3.5C20 16.866 16.418 19 12 19z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 6l2-2M8 6l-1-2" />
  </svg>
);

const MortalityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);

const RevenueIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExpenseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

// ─── Page ────────────────────────────────────────────────────────────────────
// ─── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-[#e8f5e8] rounded-xl ${className}`} />
);

// ─── Page ────────────────────────────────────────────────────────────────────
export default function BroilerFarmDashboard() {
  const [records, setRecords] = useState<BroilerFarmRecord[]>([]);
  const [batches, setBatches] = useState<string[][]>([]);
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const todayStr   = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });

  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      setLoading(true);
      setError(false);
      setErrorMessage(null);

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setErrorMessage('Not authenticated. Please refresh the page.');
        return;
      }

      // Fetch records and batches
      const [recRes, batchRes] = await Promise.all([
        fetch('/api/broiler-farm', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: controller.signal,
        }),
        fetch('/api/admin/batches', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
      ]);

      clearTimeout(timeout);

      if (!recRes.ok) {
        const data = await recRes.json().catch(() => ({}));
        setErrorMessage(data.error || 'Failed to load records');
      } else {
        const data = await recRes.json();
        setRecords(data.data || []);
      }

      if (batchRes.ok) {
        const data = await batchRes.json();
        setBatches(data || []);
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error('Failed to fetch data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRecords = selectedBatch === 'All'
    ? records
    : records.filter(r => r.batch === selectedBatch);

  // ── Derive today's totals ────────────────────────────────────────────────
  const todayRecords  = filteredRecords.filter((r) => r.date === todayStr);
  
  // Summary card metrics (today, filtered by batch)
  const totalLiveBirds = todayRecords.reduce((s, r) => s + (r.liveBirds  || 0), 0);
  const revenue        = todayRecords.reduce((s, r) => s + (r.revenue    || 0), 0);
  const expenses       = todayRecords.reduce((s, r) => s + (r.expenses   || 0), 0);
  const profit         = revenue - expenses;

  // Recent submissions
  const recent = filteredRecords.slice(0, 20);

  return (
    <div className="space-y-8 pb-8 px-4 py-4 md:px-8 md:py-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#1B6B3A]">
          Broiler Farm — Management
        </h1>
        <p className="text-[#111827] opacity-70 text-base">{todayLabel}</p>
      </div>

      {/* ── Error Boundaries ───────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
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

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* ── Batch Selector ─────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedBatch('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
            ${selectedBatch === 'All'
              ? 'bg-[#1B6B3A] text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-400 hover:border-[#1B6B3A] hover:text-[#1B6B3A]'}`}
        >
          All Batches
        </button>
        {batches.map(batch => (
          <button
            key={batch[0]}
            onClick={() => setSelectedBatch(batch[0])}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
              ${selectedBatch === batch[0]
                ? 'bg-[#1B6B3A] text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-400 hover:border-[#1B6B3A] hover:text-[#1B6B3A]'}`}
          >
            {batch[0]}
          </button>
        ))}
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-28"/>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Number of Birds"
            value={totalLiveBirds.toLocaleString()}
            color="green"
            icon={<BirdIcon />}
          />
          <StatCard
            title="Revenues"
            value={formatRWF(revenue)}
            color="green"
            icon={<RevenueIcon />}
          />
          <StatCard
            title="Expenses"
            value={formatRWF(expenses)}
            color="orange"
            icon={<ExpenseIcon />}
          />
          <StatCard
            title="Profit"
            value={formatRWF(profit)}
            color={profit >= 0 ? 'green' : 'red'}
            icon={<RevenueIcon />}
          />
        </div>
      )}

      {/* ── Batch Breakdown Cards (Only when All is selected) ─────────── */}
      {selectedBatch === 'All' && batches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(batch => {
            const batchRows = records.filter(r => r.batch === batch[0]);
            const batchToday = batchRows.find(r => r.date === todayStr);
            const batchRevenue = batchRows.reduce((sum, r) => sum + (r.revenue || 0), 0);
            const batchLiveBirds = batchToday?.liveBirds || 0;

            return (
              <div key={batch[0]} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-[#2D2D2D]">{batch[0]}</p>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full 
                    ${batch[2] === 'Active' ? 'bg-[#EAF5EE] text-[#1B6B3A]' : 'bg-gray-100 text-gray-400'}`}>
                    {batch[2]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Live Birds</p>
                    <p className="text-lg font-bold text-[#1B6B3A] font-mono">{batchLiveBirds}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mortality</p>
                    <p className="text-lg font-bold text-red-500 font-mono">{batchToday?.mortality || 0}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Main Layout ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Form — 60% */}
        <div className="lg:col-span-3">
          <BroilerFarmForm onSubmitSuccess={fetchData} />
        </div>

        {/* Recent Submissions — 40% */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl md:text-2xl font-bold text-[#111827]">
              Recent Submissions
              {selectedBatch !== 'All' && <span className="text-[#1B6B3A] ml-2">({selectedBatch})</span>}
            </h2>
            <button
              onClick={fetchData}
              className="text-xs text-[#1B6B3A] hover:underline font-bold"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1B6B3A] border-t-transparent" />
            </div>
          ) : recent.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-12 flex flex-col items-center gap-2 shadow-sm">
              <span className="text-4xl text-gray-200 font-bold">BATCH EMPTY</span>
              <p className="text-sm text-gray-400">No data found for this batch.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <div className="min-w-[600px] px-4 md:px-0 md:min-w-0">
                  <Table className="w-full">
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="font-bold text-[10px] uppercase">Date</TableHead>
                        {selectedBatch === 'All' && <TableHead className="font-bold text-[10px] uppercase">Batch</TableHead>}
                        <TableHead className="font-bold text-[10px] uppercase text-right">Opening</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase text-right">Mortality</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase text-right">Sold</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase text-right">Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recent.map((record, idx) => (
                        <TableRow key={`${record.date}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="whitespace-nowrap font-bold text-xs">
                            {formatDate(record.date)}
                          </TableCell>
                          {selectedBatch === 'All' && (
                            <TableCell className="font-bold text-xs text-[#1B6B3A]">
                              {record.batch}
                            </TableCell>
                          )}
                          <TableCell className="font-mono text-right text-xs">
                            {record.numberOfBirds}
                          </TableCell>
                          <TableCell className="font-mono text-right text-red-500 font-bold text-xs">
                            {record.mortality}
                          </TableCell>
                          <TableCell className="font-mono text-right text-[#E07B00] font-bold text-xs">
                            {record.birdsSold}
                          </TableCell>
                          <TableCell className="font-mono text-right text-[#1B6B3A] font-bold text-xs">
                            {record.liveBirds}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
