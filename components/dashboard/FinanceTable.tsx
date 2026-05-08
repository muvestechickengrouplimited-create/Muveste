import React from 'react';
import { Card } from '../ui/Card';
import { formatDate } from '../../lib/utils';
import { Button } from '../ui/Button';

interface FinanceRecord {
  date: string;
  broilerRevenue: number; broilerExpenses: number; broilerProfit: number;
  butcherRevenue: number; butcherExpenses: number; butcherProfit: number;
  totalRevenue: number; totalExpenses: number; netProfit: number;
}

interface Props {
  records: FinanceRecord[];
  loading: boolean;
  onExport: () => void;
}

export function FinanceTable({ records, loading, onExport }: Props) {
  const profitTextColor = (value: number) => {
    if (value > 0) return 'text-[#1B6B3A] font-semibold';
    if (value === 0) return 'text-gray-400';
    return 'text-[#D9534F] font-semibold';
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="flex justify-between items-center p-5 bg-white border-b border-gray-100">
        <h2 className="text-lg font-bold text-[#2D2D2D]">Historical Records</h2>
        <Button onClick={onExport} variant="outline" className="text-sm h-9 border-gray-200">
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            {/* Group Headers */}
            <tr>
              <th rowSpan={2} className="bg-gray-50 text-gray-600 font-semibold p-3 border-b border-r min-w-[100px] align-bottom">Date</th>
              <th colSpan={3} className="bg-[#E07B00] text-white text-center font-bold p-2 border-r border-[#b36200]">Broiler Farm</th>
              <th colSpan={3} className="bg-[#2D2D2D] text-white text-center font-bold p-2 border-r border-[#1a1a1a]">Butchery</th>
              <th colSpan={3} className="bg-[#164F2C] text-white text-center font-bold p-2">Overall</th>
            </tr>
            {/* Sub Headers */}
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              {['BF', 'BU'].map(grp => (
                <React.Fragment key={grp}>
                  <th className="p-2 border-b font-medium">Rev</th>
                  <th className="p-2 border-b font-medium">Exp</th>
                  <th className="p-2 border-b border-r font-medium text-black">Profit</th>
                </React.Fragment>
              ))}
              <th className="p-2 border-b font-medium text-[#1B6B3A]">Total Rev</th>
              <th className="p-2 border-b font-medium text-[#E07B00]">Total Exp</th>
              <th className="p-2 border-b font-bold text-black">Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center p-8 text-gray-400">Loading records...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center p-8 text-gray-400 bg-white">No records found for this period.</td>
              </tr>
            ) : (
              records.map((r, i) => (
                <tr key={i} className={`border-b hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-[#EAF5EE]/30'}`}>
                  <td className="p-3 border-r font-medium text-gray-800 whitespace-nowrap">{formatDate(r.date)}</td>

                  {/* BF */}
                  <td className="p-2 font-mono text-gray-600">{r.broilerRevenue?.toLocaleString() || '0'}</td>
                  <td className="p-2 font-mono text-gray-600">{r.broilerExpenses?.toLocaleString() || '0'}</td>
                  <td className={`p-2 font-mono border-r ${profitTextColor(r.broilerProfit)}`}>{r.broilerProfit?.toLocaleString() || '0'}</td>

                  {/* BU */}
                  <td className="p-2 font-mono text-gray-600">{r.butcherRevenue?.toLocaleString() || '0'}</td>
                  <td className="p-2 font-mono text-gray-600">{r.butcherExpenses?.toLocaleString() || '0'}</td>
                  <td className={`p-2 font-mono border-r ${profitTextColor(r.butcherProfit)}`}>{r.butcherProfit?.toLocaleString() || '0'}</td>

                  {/* Overall */}
                  <td className="p-2 font-mono font-semibold text-[#1B6B3A]">{r.totalRevenue?.toLocaleString() || '0'}</td>
                  <td className="p-2 font-mono font-semibold text-[#E07B00]">{r.totalExpenses?.toLocaleString() || '0'}</td>
                  <td className={`p-2 font-mono text-base ${profitTextColor(r.netProfit)}`}>{r.netProfit?.toLocaleString() || '0'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
