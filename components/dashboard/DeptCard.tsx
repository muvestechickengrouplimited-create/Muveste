import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { formatRWF } from '../../lib/utils';

interface DeptCardProps {
  name: string;
  data: any;
}

export function DeptCard({ name, data }: DeptCardProps) {
  const { revenue, expenses, profit, active, ...details } = data;

  return (
    <Card className="overflow-hidden border-2 border-transparent hover:border-gray-100 transition-colors">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-gray-800">{name}</h3>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
            active ? 'bg-[#EAF5EE] text-[#1B6B3A]' : 'bg-orange-50 text-[#E07B00]'
          }`}>
            {active ? 'Active' : 'Pending'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {Object.entries(details).map(([key, value]) => (
            <div key={key}>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="font-semibold text-gray-800">{String(value)}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Revenue</span>
            <span className="font-mono text-gray-800">{formatRWF(revenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Expenses</span>
            <span className="font-mono text-gray-800">{formatRWF(expenses)}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-50 border-dashed">
            <span className="text-gray-900">Profit</span>
            <span className={`font-mono ${profit >= 0 ? 'text-[#1B6B3A]' : 'text-[#D9534F]'}`}>
              {formatRWF(profit)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
