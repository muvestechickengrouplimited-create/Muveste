'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { auth } from '../../../../lib/firebase';

export default function AdminBroilerFarmPage() {
  const [data, setData] = useState<{ headers: string[], rows: string[][] }>({ headers: [], rows: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDept() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/admin/department?dept=broiler-farm`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          let headers = [...(json.headers || [])];
          let rows = [...(json.data || [])].map((row: string[]) => {
            const newRow = [...row];
            while (newRow.length < headers.length) newRow.push('');
            return newRow;
          });

          const moveCol = (colName: string, afterColName: string) => {
            const colIdx = headers.findIndex(h => h?.toString().toLowerCase().includes(colName.toLowerCase()));
            const afterIdx = headers.findIndex(h => h?.toString().toLowerCase().includes(afterColName.toLowerCase()));
            
            if (colIdx !== -1 && afterIdx !== -1) {
              const [h] = headers.splice(colIdx, 1);
              const newAfterIdx = headers.findIndex(h => h?.toString().toLowerCase().includes(afterColName.toLowerCase()));
              headers.splice(newAfterIdx + 1, 0, h);
              
              rows = rows.map(row => {
                const newRow = [...row];
                const [cell] = newRow.splice(colIdx, 1);
                newRow.splice(newAfterIdx + 1, 0, cell);
                return newRow;
              });
            }
          };

          moveCol('Medications Given', 'Water');
          moveCol('Notes', 'Revenue');

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
    a.download = `muveste-admin-broiler-farm.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#E07B00]">Broiler Farm Database</h1>
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
              <tr className="bg-[#E07B00] text-white">
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
                  <tr key={i} className={`border-b hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-[#fff4e6]/50'}`}>
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
