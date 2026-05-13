import React from 'react';
import { Card, CardContent } from './Card';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'green' | 'yellow' | 'orange' | 'red' | 'blue';
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  className?: string;
}

export function StatCard({ title, value, icon, color, trend, className }: StatCardProps) {
  const colorMap = {
    green: 'bg-[#EAF5EE] text-[#1B6B3A]',
    yellow: 'bg-[#FFF8E1] text-[#E07B00]',
    orange: 'bg-[#FFF8E1] text-[#E07B00]',
    red: 'bg-red-50 text-[#D9534F]',
    blue: 'bg-blue-50 text-blue-600',
  };

  const colorClasses = color ? colorMap[color] : 'bg-[#EAF5EE] text-[#1B6B3A]';

  return (
    <Card className={cn('overflow-hidden min-h-[100px]', className)}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between space-x-4">
          <div className="flex flex-col space-y-1.5 min-w-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate">{title}</p>
            <div className="flex items-baseline space-x-2 min-w-0">
              <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-[#111827] font-mono-numbers">
                {value}
              </h2>
            </div>
          </div>
          {icon && (
            <div className={cn('flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full', colorClasses)}>
              {icon}
            </div>
          )}
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center space-x-2 text-sm">
            <span
              className={cn(
                'font-medium',
                trend.isPositive === true ? 'text-[#10B981]' : 
                trend.isPositive === false ? 'text-[#EF4444]' : 
                'text-gray-500'
              )}
            >
              {trend.isPositive === true ? '+' : trend.isPositive === false ? '-' : ''}
              {trend.value}
            </span>
            {trend.label && <span className="text-gray-500">{trend.label}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
