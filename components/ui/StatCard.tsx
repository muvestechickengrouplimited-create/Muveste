import React from 'react';
import { Card, CardContent } from './Card';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between space-x-4">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-bold tracking-tight text-[#111827] font-mono-numbers">
                {value}
              </h2>
            </div>
          </div>
          {icon && (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#EAF5EE] text-[#1B6B3A]">
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
