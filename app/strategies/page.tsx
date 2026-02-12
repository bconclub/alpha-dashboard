'use client';

import { useState, useMemo } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { PnLChart } from '@/components/charts/PnLChart';
import { Badge } from '@/components/ui/Badge';
import {
  formatPnL,
  formatPercentage,
  formatCurrency,
  formatTimeAgo,
  formatDate,
  getStrategyColor,
  cn,
} from '@/lib/utils';
import type { Strategy, Trade } from '@/lib/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STRATEGIES: Strategy[] = ['Grid', 'Momentum', 'Arbitrage'];

const STRATEGY_BADGE_VARIANT: Record<Strategy, 'blue' | 'warning' | 'purple'> =
  {
    Grid: 'blue',
    Momentum: 'warning',
    Arbitrage: 'purple',
  };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeStats(trades: Trade[], strategy: Strategy) {
  const filtered = trades.filter((t) => t.strategy === strategy);
  const wins = filtered.filter((t) => t.pnl > 0).length;
  const losses = filtered.filter((t) => t.pnl < 0).length;
  const totalPnL = filtered.reduce((sum, t) => sum + t.pnl, 0);
  const avgPnL = filtered.length > 0 ? totalPnL / filtered.length : 0;

  // Most recent trade for "last active"
  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const lastActive = sorted.length > 0 ? sorted[0].timestamp : null;

  return {
    totalTrades: filtered.length,
    wins,
    losses,
    winRate: filtered.length > 0 ? (wins / filtered.length) * 100 : 0,
    totalPnL,
    avgPnL,
    lastActive,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StrategiesPage() {
  const { trades, strategyLog } = useSupabase();
  const [activeTab, setActiveTab] = useState<Strategy>('Grid');

  // Compute stats for each strategy
  const statsMap = useMemo(() => {
    const map: Record<Strategy, ReturnType<typeof computeStats>> = {
      Grid: computeStats(trades, 'Grid'),
      Momentum: computeStats(trades, 'Momentum'),
      Arbitrage: computeStats(trades, 'Arbitrage'),
    };
    return map;
  }, [trades]);

  // Filtered trades for the active tab
  const filteredTrades = useMemo(
    () => trades.filter((t) => t.strategy === activeTab),
    [trades, activeTab],
  );

  // Last 20 strategy log entries
  const recentLogs = useMemo(() => strategyLog.slice(0, 20), [strategyLog]);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <h1 className="text-2xl font-bold tracking-tight text-white">
        Strategy Performance
      </h1>

      {/* ------------------------------------------------------------------- */}
      {/* Strategy cards                                                       */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {STRATEGIES.map((strategy) => {
          const stats = statsMap[strategy];
          const color = getStrategyColor(strategy);

          return (
            <div
              key={strategy}
              className="bg-card border border-zinc-800 rounded-xl p-6"
              style={{ borderLeftColor: color, borderLeftWidth: 4 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                {strategy}
              </h3>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Total Trades</dt>
                  <dd className="font-medium text-zinc-200">
                    {stats.totalTrades}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Win Rate</dt>
                  <dd className="font-medium text-zinc-200">
                    {formatPercentage(stats.winRate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Wins</dt>
                  <dd className="font-medium text-emerald-400">
                    {stats.wins}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Losses</dt>
                  <dd className="font-medium text-red-400">{stats.losses}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Total P&L</dt>
                  <dd
                    className={cn(
                      'font-medium font-mono',
                      stats.totalPnL >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400',
                    )}
                  >
                    {formatPnL(stats.totalPnL)}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Avg P&L / Trade</dt>
                  <dd
                    className={cn(
                      'font-medium font-mono',
                      stats.avgPnL >= 0 ? 'text-emerald-400' : 'text-red-400',
                    )}
                  >
                    {formatCurrency(stats.avgPnL)}
                  </dd>
                </div>
              </dl>

              {stats.lastActive && (
                <p className="mt-4 text-xs text-zinc-500">
                  Last active {formatTimeAgo(stats.lastActive)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Tabbed P&L chart per strategy                                        */}
      {/* ------------------------------------------------------------------- */}
      <div>
        {/* Tab bar */}
        <div className="flex gap-1 mb-4">
          {STRATEGIES.map((strategy) => (
            <button
              key={strategy}
              onClick={() => setActiveTab(strategy)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeTab === strategy
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800',
              )}
            >
              {strategy}
            </button>
          ))}
        </div>

        {/* Chart for selected strategy */}
        <PnLChart trades={filteredTrades} strategy={activeTab} />
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Strategy Switch Log (timeline)                                       */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-card border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-6">
          Strategy Switch Log
        </h3>

        {recentLogs.length === 0 ? (
          <p className="text-sm text-zinc-500">No strategy switch events yet</p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-700" />

            <ul className="space-y-6">
              {recentLogs.map((entry) => (
                <li key={entry.id} className="relative flex gap-4 pl-6">
                  {/* Dot */}
                  <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-700 bg-zinc-900" />

                  <div className="min-w-0 flex-1">
                    {/* Timestamp */}
                    <p className="text-xs text-zinc-500 mb-1">
                      {formatDate(entry.timestamp)}
                    </p>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="default">
                        {entry.market_condition}
                      </Badge>
                      <Badge
                        variant={
                          STRATEGY_BADGE_VARIANT[entry.strategy_selected]
                        }
                      >
                        {entry.strategy_selected}
                      </Badge>
                    </div>

                    {/* Reason */}
                    <p className="text-sm text-zinc-300">{entry.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
