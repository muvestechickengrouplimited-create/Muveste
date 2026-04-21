'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { FinanceTable } from '../../../../components/dashboard/FinanceTable';
import { StatCard } from '../../../../components/ui/StatCard';
import { formatRWF } from '../../../../lib/utils';
import { auth } from '../../../../lib/firebase';

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

export default function AdminFinancePage() {
  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(`/api/admin/finance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setRecords(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const displayedRecords = period === 'monthly' ? records.filter(r => r.date.startsWith(thisMonthStr)) : records;

  const mRev = displayedRecords.reduce((s, r) => s + r.totalRevenue, 0);
  const mExp = displayedRecords.reduce((s, r) => s + r.totalExpenses, 0);
  const mProf = displayedRecords.reduce((s, r) => s + r.netProfit, 0);

  const exportCSV = () => {
    const headers = [
      'Date',
      'EF Rev', 'EF Exp', 'EF Profit',
      'BF Rev', 'BF Exp', 'BF Profit',
      'KB Rev', 'KB Exp', 'KB Profit',
      'KN Rev', 'KN Exp', 'KN Profit',
      'BU Rev', 'BU Exp', 'BU Profit',
      'Total Rev', 'Total Exp', 'Net Profit'
    ];
    const rows = displayedRecords.map(r => [
      r.date,
      r.eggFarmRevenue, r.eggFarmExpenses, r.eggFarmProfit,
      r.broilerRevenue, r.broilerExpenses, r.broilerProfit,
      r.kioskBatsindaRevenue, r.kioskBatsindaExpenses, r.kioskBatsindaProfit,
      r.kioskNyabugogoRevenue, r.kioskNyabugogoExpenses, r.kioskNyabugogoProfit,
      r.butcherRevenue, r.butcherExpenses, r.butcherProfit,
      r.totalRevenue, r.totalExpenses, r.netProfit
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `30plus-admin-finance-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B6B3A]">Finance Database (Read-Only)</h1>
          <p className="text-[#111827] opacity-70 text-base">Master finance logs access</p>
        </div>

        {/* Toggle */}
        <div className="flex gap-2">
          <button onClick={() => setPeriod('daily')}
            className={period === 'daily'
              ? 'bg-[#F5C518] text-[#2D2D2D] font-bold rounded-xl px-4 py-2 transition-colors'
              : 'border border-gray-200 bg-white text-gray-500 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors'}>
            All Time
          </button>
          <button onClick={() => setPeriod('monthly')}
            className={period === 'monthly'
              ? 'bg-[#F5C518] text-[#2D2D2D] font-bold rounded-xl px-4 py-2 transition-colors'
              : 'border border-gray-200 bg-white text-gray-500 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors'}>
            This Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={`${period === 'monthly' ? 'Monthly' : 'All-Time'} revenue`} value={formatRWF(mRev)} icon={<RevenueIcon />} className="border-l-4 border-[#1B6B3A]" />
        <StatCard title={`${period === 'monthly' ? 'Monthly' : 'All-Time'} expenses`} value={formatRWF(mExp)} icon={<ExpenseIcon />} className="border-l-4 border-[#E07B00]" />
        <StatCard title={`${period === 'monthly' ? 'Monthly' : 'All-Time'} profit`} value={formatRWF(mProf)} icon={<ProfitIcon />} className={`border-l-4 ${mProf >= 0 ? 'border-[#1B6B3A]' : 'border-[#D9534F]'}`} />
        <StatCard title="Total days recorded" value={`${displayedRecords.length}`} icon={<DocumentIcon />} className="border-l-4 border-[#F5C518]" />
      </div>

      <FinanceTable records={displayedRecords} loading={loading} onExport={exportCSV} />
    </div>
  );
}
