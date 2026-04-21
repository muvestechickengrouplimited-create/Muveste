import React, { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:ring-offset-2';
  
  const variants = {
    // Default uses the Main Deep Green color
    default: 'bg-[#1B6B3A] text-white hover:bg-[#15542d]',
    // Success uses the positive profit green
    success: 'bg-[#10B981] text-white hover:bg-[#0d9668]',
    // Warning uses the Primary Yellow color
    warning: 'bg-[#F5C518] text-gray-900 hover:bg-[#e3b515]',
    // Error uses the negative profit red
    error: 'bg-[#EF4444] text-white hover:bg-[#dc2626]',
    // Outline is neutral
    outline: 'text-gray-700 border border-gray-200 hover:bg-gray-100',
  };

  return (
    <div 
      className={cn(baseStyles, variants[variant], className)} 
      {...props} 
    />
  );
}
