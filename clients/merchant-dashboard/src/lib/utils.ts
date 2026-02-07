import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number, currency: string = 'QAR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Converts MongoDB Decimal128 values to regular numbers.
 * MongoDB Decimal128 values are returned as objects like { $numberDecimal: "123.45" }
 */
export function toNumber(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'object') {
    if ('$numberDecimal' in value) {
      const parsed = Number((value as any).$numberDecimal);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if ('$numberInt' in value) {
      const parsed = Number((value as any).$numberInt);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if ('$numberLong' in value) {
      const parsed = Number((value as any).$numberLong);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if ('$numberDouble' in value) {
      const parsed = Number((value as any).$numberDouble);
      return Number.isFinite(parsed) ? parsed : 0;
    }
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
