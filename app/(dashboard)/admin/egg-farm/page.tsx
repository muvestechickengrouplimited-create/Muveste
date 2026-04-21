'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { auth } from '../../../../lib/firebase';

export default function AdminEggFarmPage() {
  const [data, setData] = useState<{ headers: string[], rows: string[][] }>({ headers: [], rows: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDept() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/admin/department?dept=egg-farm`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          let headers: string[] = [...(json.headers || [])];
          let rows: string[][] = (json.data || []).map((r: string[]) => [...r]);

          headers = headers.map(h => h.trim());

          const ensureColumn = (colName: string) => {
            if (!headers.includes(colName)) {
              headers.push(colName);
              rows.forEach(r => r.push(''));
            }
          };

          ensureColumn('Medications Given');
          ensureColumn('Notes');

          rows.forEach(r => {
            while (r.length < headers.length) r.push('');
          });

          const moveColumnAfter = (colName: string, afterColNameRegex: RegExp) => {
            const fromIdx = headers.indexOf(colName);
            const afterIdx = headers.findIndex(h => afterColNameRegex.test(h));
            
            if (fromIdx !== -1 && afterIdx !== -1 && fromIdx !== afterIdx + 1) {
              const [h] = headers.splice(fromIdx, 1);
              const newAfterIdx = headers.findIndex(h => afterColNameRegex.test(h));
              headers.splice(newAfterIdx + 1, 0, h);
              
              rows.forEach(r => {
                const [val] = r.splice(fromIdx, 1);
                r.splice(newAfterIdx + 1, 0, val);
              });
            }
          };

          moveColumnAfter('Medications Given', /^Water/i);
          moveColumnAfter('Notes', /^Expenses/i);

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

  const exportCSV = () => {
    const csvContent = [data.headers, ...data.rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `30plus-admin-egg-farm.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1B6B3A]">Egg Farm Database</h1>
          <p className="text-[#111827] opacity-70 text-base">Raw Data View (Read-Only)</p>
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
              <tr className="bg-[#1B6B3A] text-white">
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
              ) : data.rows.length === 0 ? (
                <tr>
                  <td colSpan={data.headers.length || 10} className="text-center p-8 text-gray-400 bg-white">No records found.</td>
                </tr>
              ) : (
                data.rows.map((row, i) => (
                  <tr key={i} className={`border-b hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-[#EAF5EE]/30'}`}>
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
