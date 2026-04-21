'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { useToast } from '../../../../components/ui/Toast';
import { auth } from '../../../../lib/firebase';

const DEPTS = [
  { id: 'egg-farm', label: 'Egg Farm' },
  { id: 'broiler-farm', label: 'Broiler Farm' },
  { id: 'egg-kiosk', label: 'Egg Kiosk' },
  { id: 'butcher', label: 'butcher' },
  { id: 'finance-summary', label: 'Finance (Summary)' },
];

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [dept, setDept] = useState('egg-farm');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ headers: string[], rows: string[][] } | null>(null);

  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();

      const query = new URLSearchParams({ dept });
      if (fromDate) query.append('fromDate', fromDate);
      if (toDate) query.append('toDate', toDate);

      const res = await fetch(`/api/admin/reports?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to generate report');

      const json = await res.json();
      setData({ headers: json.headers, rows: json.data });
      toast('Report generated successfully!', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to fetch report data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const csvContent = [data.headers, ...data.rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `30plus-${dept}-report-${fromDate || 'start'}-to-${toDate || 'end'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B6B3A]">Custom Reports</h1>
          <p className="text-[#111827] opacity-70 text-base">Generate exports dynamically across any timeframe</p>
        </div>
      </div>

      <Card className="border border-gray-100 shadow-md">
        <div className="p-5 border-b border-gray-100 bg-[#EAF5EE]/30">
          <h2 className="text-lg font-bold text-[#1B6B3A]">Report Configuration</h2>
        </div>
        <CardContent className="p-6">
          <form onSubmit={generateReport} className="flex flex-col md:flex-row gap-6 items-end">
            <div className="w-full md:w-1/4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6B3A] focus:border-transparent transition-colors shadow-sm"
              >
                {DEPTS.map(d => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-1/4">
              <Input label="From Date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="w-full md:w-1/4">
              <Input label="To Date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <div className="w-full md:w-1/4">
              <Button type="submit" className="w-full h-11 mb-1 shadow text-[#F5C518]" isLoading={loading}>
                Generate Report
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Preview */}
      {data && (
        <Card className="overflow-hidden border border-gray-100 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center p-5 bg-white border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#2D2D2D]">Report Preview ({data.rows.length} rows)</h2>
            <Button onClick={exportCSV} variant="outline" className="text-sm h-9 border-gray-200">
              Export to CSV
            </Button>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#1B6B3A] text-white">
                  {data.headers.map((h, i) => (
                    <th key={i} className="p-3 font-semibold whitespace-nowrap shadow-sm border-b border-[#164F2C]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={data.headers.length || 1} className="text-center p-8 text-gray-400">
                      No matching records found for this criteria.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      {row.map((cell, j) => (
                        <td key={j} className={`p-3 whitespace-nowrap ${j > 0 ? 'font-mono text-gray-600' : 'font-medium text-gray-800'}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
