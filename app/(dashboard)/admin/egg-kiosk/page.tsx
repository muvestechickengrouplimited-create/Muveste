'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { auth } from '../../../../lib/firebase';

export default function AdminEggKioskPage() {
  const [data, setData] = useState<{ headers: string[], rows: string[][] }>({ headers: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('All Locations');

  useEffect(() => {
    async function fetchDept() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/admin/department?dept=egg-kiosk`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          let headers = json.headers;
          let rows = json.data;

          const locIdx = headers.findIndex((h: string) => h.toLowerCase().includes('location'));
          if (locIdx === -1 && headers.length > 0) {
            headers = [headers[0], 'Location', ...headers.slice(1)];
            rows = rows.map((r: string[]) => [r[0], '', ...r.slice(1)]);
          } else if (locIdx !== -1 && locIdx !== 1) {
            headers = [headers[0], headers[locIdx], ...headers.filter((_: string, i: number) => i !== 0 && i !== locIdx)];
            rows = rows.map((r: string[]) => [r[0], r[locIdx], ...r.filter((_: string, i: number) => i !== 0 && i !== locIdx)]);
          }

          setData({ headers, rows });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDept();
  }, []);

  const filteredRows = data.rows.filter((row) => {
    if (locationFilter === 'All Locations') return true;
    return row[1] === locationFilter;
  });

  const exportCSV = () => {
    const csvContent = [data.headers, ...filteredRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `30plus-admin-egg-kiosk.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5C518]">Egg Kiosk Database</h1>
          <p className="text-[#111827] opacity-70 text-base">Raw Data View (Read-Only)</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="loc-filter" className="text-sm font-medium text-gray-700">Location:</label>
          <select
            id="loc-filter"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C518] bg-white text-[#111827]"
          >
            <option value="All Locations">All Locations</option>
            <option value="Batsinda, Kigali">Batsinda, Kigali</option>
            <option value="Nyabugogo, Kigali">Nyabugogo, Kigali</option>
          </select>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="flex justify-between items-center p-5 bg-white border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#2D2D2D]">Historical Records</h2>
          <Button onClick={exportCSV} variant="outline" className="text-sm h-9 border-gray-200">
             Export CSV
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#F5C518] text-[#2D2D2D]">
                {data.headers.map((h, i) => (
                  <th key={i} className={`p-3 font-semibold ${i === 0 ? 'min-w-[100px]' : ''}`}>
                     {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={data.headers.length || 10} className="text-center p-8 text-gray-400">Loading records...</td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={data.headers.length || 10} className="text-center p-8 text-gray-400 bg-white">No records found.</td>
                </tr>
              ) : (
                filteredRows.map((row, i) => (
                  <tr key={i} className={`border-b hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-[#fffbe6]/50'}`}>
                    {row.map((cell, j) => (
                      <td key={j} className={`p-3 ${j > 0 ? 'font-mono text-gray-600' : 'font-medium text-gray-800'}`}>
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
    </div>
  );
}
