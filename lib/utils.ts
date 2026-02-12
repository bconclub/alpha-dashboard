import { format, formatDistanceToNow } from 'date-fns';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPnL(value: number): string {
  const formatted = formatCurrency(Math.abs(value));
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatDate(timestamp: string): string {
  return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
}

export function formatShortDate(timestamp: string): string {
  return format(new Date(timestamp), 'MMM dd HH:mm');
}

export function formatTimeAgo(timestamp: string): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getStrategyColor(strategy: string): string {
  switch (strategy) {
    case 'Grid': return '#3b82f6';
    case 'Momentum': return '#f59e0b';
    case 'Arbitrage': return '#8b5cf6';
    default: return '#6b7280';
  }
}

export function getPnLColor(value: number): string {
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-red-400';
  return 'text-zinc-400';
}

export function getPnLBg(value: number): string {
  if (value > 0) return 'bg-emerald-400/10 text-emerald-400';
  if (value < 0) return 'bg-red-400/10 text-red-400';
  return 'bg-zinc-400/10 text-zinc-400';
}

export function tradesToCSV(trades: Array<Record<string, unknown>>): string {
  if (trades.length === 0) return '';
  const headers = Object.keys(trades[0]);
  const rows = trades.map(t => headers.map(h => JSON.stringify(t[h] ?? '')).join(','));
  return [headers.join(','), ...rows].join('\n');
}
