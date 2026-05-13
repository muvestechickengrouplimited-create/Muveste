import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind CSS classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Rwandan Francs (RWF)
 * Example: formatRWF(150000) -> "RWF 150,000"
 */
export function formatRWF(amount: number): string {
  if (isNaN(amount)) return '0';
  return `${new Intl.NumberFormat('en-US').format(amount)}`;
}

/**
 * Formats a date object or string into a standard readable date
 */
export const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Formats a date object or string into a time string
 */
export function formatTime(dateInput?: string | Date): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Calculates the profit given revenue and expenses
 */
export function calculateProfit(revenue: number, expenses: number): number {
  const validRevenue = isNaN(revenue) ? 0 : revenue;
  const validExpenses = isNaN(expenses) ? 0 : expenses;
  return validRevenue - validExpenses;
}
