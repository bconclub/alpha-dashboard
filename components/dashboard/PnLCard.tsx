'use client';

import { useMemo } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { StatCard } from '@/components/ui/StatCard';
import { formatPnL, formatPercentage, formatCurrency } from '@/lib/utils';

export function PnLCard() {
  const { botStatus, trades } = useSupabase();

  const todayPnL = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return trades
      .filter((t) => new Date(t.timestamp) >= startOfDay)
      .reduce((sum, t) => sum + t.pnl, 0);
  }, [trades]);

  const totalPnL = botStatus?.total_pnl ?? 0;
  const winRate = botStatus?.win_rate ?? 0;
  const capital = botStatus?.capital ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total P&L"
        value={formatPnL(totalPnL)}
        changeType={totalPnL > 0 ? 'positive' : totalPnL < 0 ? 'negative' : 'neutral'}
      />
      <StatCard
        title="Today's P&L"
        value={formatPnL(todayPnL)}
        changeType={todayPnL > 0 ? 'positive' : todayPnL < 0 ? 'negative' : 'neutral'}
      />
      <StatCard
        title="Win Rate"
        value={formatPercentage(winRate)}
        changeType={winRate >= 50 ? 'positive' : winRate > 0 ? 'negative' : 'neutral'}
      />
      <StatCard
        title="Current Capital"
        value={formatCurrency(capital)}
        changeType="neutral"
      />
    </div>
  );
}
