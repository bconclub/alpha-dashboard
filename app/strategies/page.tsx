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
  getExchangeLabel,
  getExchangeColor,
  cn,
} from '@/lib/utils';
import type { Strategy, Trade } from '@/lib/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STRATEGIES: Strategy[] = ['Grid', 'Momentum', 'Arbitrage', 'futures_momentum'];

const STRATEGY_BADGE_VARIANT: Record<Strategy, 'blue' | 'warning' | 'purple'> = {
  Grid: 'blue',
  Momentum: 'warning',
  Arbitrage: 'purple',
  futures_momentum: 'warning',
};

const STRATEGY_LABELS: Record<Strategy, string> = {
  Grid: 'Grid',
  Momentum: 'Momentum',
  Arbitrage: 'Arbitrage',
  futures_momentum: 'Futures Momentum',
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

  // Spot vs futures breakdown
  const spotTrades = filtered.filter((t) => t.position_type === 'spot');
  const futuresTrades = filtered.filter((t) => t.position_type !== 'spot');
  const spotPnL = spotTrades.reduce((sum, t) => sum + t.pnl, 0);
  const futuresPnL = futuresTrades.reduce((sum, t) => sum + t.pnl, 0);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const lastActive = sorted.length > 0 ? sorted[0].timestamp : null;

  return {
    totalTrades: filtered.length,
    wins,
    losses,
    winRate: filtered.length > 0 ? (wins / filtered.length) * 100 : 0,
    totalPnL,
    avgPnL,
    spotTrades: spotTrades.length,
    futuresTrades: futuresTrades.length,
    spotPnL,
    futuresPnL,
    lastActive,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StrategiesPage() {
  const { trades, strategyLog, strategyPerformance } = useSupabase();
  const [activeTab, setActiveTab] = useState<Strategy>('Grid');

  const statsMap = useMemo(() => {
    const map = {} as Record<Strategy, ReturnType<typeof computeStats>>;
    for (const s of STRATEGIES) {
      map[s] = computeStats(trades, s);
    }
    return map;
  }, [trades]);

  const filteredTrades = useMemo(
    () => trades.filter((t) => t.strategy === activeTab),
    [trades, activeTab],
  );

  const recentLogs = useMemo(() => strategyLog.slice(0, 20), [strategyLog]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">
        Strategy Performance
      </h1>

      {/* ------------------------------------------------------------------- */}
      {/* Strategy cards                                                       */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                {STRATEGY_LABELS[strategy]}
              </h3>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Total Trades</dt>
                  <dd className="font-medium text-zinc-200">{stats.totalTrades}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Win Rate</dt>
                  <dd className="font-medium text-zinc-200">{formatPercentage(stats.winRate)}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Wins</dt>
                  <dd className="font-medium text-emerald-400">{stats.wins}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Losses</dt>
                  <dd className="font-medium text-red-400">{stats.losses}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Total P&L</dt>
                  <dd className={cn('font-medium font-mono', stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {formatPnL(stats.totalPnL)}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Avg P&L</dt>
                  <dd className={cn('font-medium font-mono', stats.avgPnL >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {formatCurrency(stats.avgPnL)}
                  </dd>
                </div>
                {/* Spot vs Futures breakdown */}
                <div>
                  <dt className="text-zinc-500">Spot P&L</dt>
                  <dd className={cn('font-medium font-mono text-xs', stats.spotPnL >= 0 ? 'text-blue-400' : 'text-red-400')}>
                    {formatPnL(stats.spotPnL)}
                    <span className="text-zinc-600 ml-1">({stats.spotTrades})</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Futures P&L</dt>
                  <dd className={cn('font-medium font-mono text-xs', stats.futuresPnL >= 0 ? 'text-orange-400' : 'text-red-400')}>
                    {formatPnL(stats.futuresPnL)}
                    <span className="text-zinc-600 ml-1">({stats.futuresTrades})</span>
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
      {/* Strategy Performance by Exchange (from Supabase view)                */}
      {/* ------------------------------------------------------------------- */}
      {strategyPerformance.length > 0 && (
        <div className="bg-card border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
            Strategy Performance by Exchange
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                  <th className="pb-2 pr-4 font-medium">Strategy</th>
                  <th className="pb-2 pr-4 font-medium">Exchange</th>
                  <th className="pb-2 pr-4 font-medium text-right">Trades</th>
                  <th className="pb-2 pr-4 font-medium text-right">Win Rate</th>
                  <th className="pb-2 pr-4 font-medium text-right">Total P&L</th>
                  <th className="pb-2 pr-4 font-medium text-right">Best Trade</th>
                  <th className="pb-2 font-medium text-right">Worst Trade</th>
                </tr>
              </thead>
              <tbody>
                {strategyPerformance.map((sp, idx) => (
                  <tr
                    key={`${sp.strategy}-${sp.exchange}`}
                    className={cn(
                      'border-b border-zinc-800/50 last:border-0',
                      idx % 2 === 0 ? 'bg-transparent' : 'bg-zinc-900/30',
                    )}
                  >
                    <td className="py-2.5 pr-4">
                      <Badge variant={STRATEGY_BADGE_VARIANT[sp.strategy] ?? 'default'}>
                        {STRATEGY_LABELS[sp.strategy] ?? sp.strategy}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: getExchangeColor(sp.exchange) }}
                        />
                        <span className="text-zinc-300">{getExchangeLabel(sp.exchange)}</span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-zinc-300">{sp.total_trades}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-zinc-300">{formatPercentage(sp.win_rate_pct)}</td>
                    <td className={cn('py-2.5 pr-4 text-right font-mono', sp.total_pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {formatPnL(sp.total_pnl)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-emerald-400">{formatPnL(sp.best_trade)}</td>
                    <td className="py-2.5 text-right font-mono text-red-400">{formatPnL(sp.worst_trade)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Tabbed P&L chart per strategy                                        */}
      {/* ------------------------------------------------------------------- */}
      <div>
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
              {STRATEGY_LABELS[strategy]}
            </button>
          ))}
        </div>
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
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-700" />

            <ul className="space-y-6">
              {recentLogs.map((entry) => (
                <li key={entry.id} className="relative flex gap-4 pl-6">
                  <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-700 bg-zinc-900" />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-500 mb-1">
                      {formatDate(entry.timestamp)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="default">{entry.market_condition}</Badge>
                      <Badge variant={STRATEGY_BADGE_VARIANT[entry.strategy_selected] ?? 'default'}>
                        {STRATEGY_LABELS[entry.strategy_selected] ?? entry.strategy_selected}
                      </Badge>
                    </div>
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
