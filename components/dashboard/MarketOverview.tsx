'use client';

import { useMemo, useState } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { Badge } from '@/components/ui/Badge';
import { formatNumber, formatPnL, formatTimeAgo, cn } from '@/lib/utils';
import type { StrategyLog } from '@/lib/types';

interface PairRow {
  pair: string;
  exchange: 'binance' | 'delta';
  currentPrice: number | null;
  priceChange15m: number | null;
  marketCondition: string;
  strategy: string;
  adx: number | null;
  rsi: number | null;
  signalStrength: number;
  lastTimestamp: string;
  totalPnl: number;
  tradeCount: number;
  // For expanded view
  log: StrategyLog | null;
}

function getConditionBadge(condition: string) {
  const c = condition?.toLowerCase() ?? '';
  if (c.includes('trend')) return { variant: 'success' as const, label: 'Trending' };
  if (c.includes('volatile') || c.includes('breakout')) return { variant: 'danger' as const, label: 'Volatile' };
  return { variant: 'warning' as const, label: 'Sideways' };
}

function SignalBar({ strength }: { strength: number }) {
  const capped = Math.min(100, Math.max(0, strength));
  const color =
    capped >= 70 ? '#00c853' : capped >= 40 ? '#ffd600' : '#ff1744';

  return (
    <div className="flex items-center gap-2 w-28">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${capped}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">{capped}</span>
    </div>
  );
}

function ExpandedRow({ row }: { row: PairRow }) {
  const log = row.log;
  return (
    <tr>
      <td colSpan={9} className="p-0">
        <div className="bg-zinc-900/60 border-t border-zinc-800 px-6 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
            {log?.macd_value != null && (
              <div>
                <span className="text-zinc-500">MACD</span>
                <span className="ml-2 font-mono text-zinc-300">{log.macd_value.toFixed(4)}</span>
              </div>
            )}
            {log?.macd_signal != null && (
              <div>
                <span className="text-zinc-500">Signal</span>
                <span className="ml-2 font-mono text-zinc-300">{log.macd_signal.toFixed(4)}</span>
              </div>
            )}
            {log?.macd_histogram != null && (
              <div>
                <span className="text-zinc-500">Histogram</span>
                <span className={cn('ml-2 font-mono', log.macd_histogram >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]')}>
                  {log.macd_histogram.toFixed(4)}
                </span>
              </div>
            )}
            {log?.bb_upper != null && (
              <div>
                <span className="text-zinc-500">BB Upper</span>
                <span className="ml-2 font-mono text-zinc-300">{formatNumber(log.bb_upper)}</span>
              </div>
            )}
            {log?.bb_lower != null && (
              <div>
                <span className="text-zinc-500">BB Lower</span>
                <span className="ml-2 font-mono text-zinc-300">{formatNumber(log.bb_lower)}</span>
              </div>
            )}
            {log?.atr != null && (
              <div>
                <span className="text-zinc-500">ATR</span>
                <span className="ml-2 font-mono text-zinc-300">{log.atr.toFixed(2)}</span>
              </div>
            )}
            {log?.volume_ratio != null && (
              <div>
                <span className="text-zinc-500">Vol Ratio</span>
                <span className="ml-2 font-mono text-zinc-300">{log.volume_ratio.toFixed(2)}x</span>
              </div>
            )}
            {/* Always show trade stats */}
            <div>
              <span className="text-zinc-500">Trades</span>
              <span className="ml-2 font-mono text-zinc-300">{row.tradeCount}</span>
            </div>
            <div>
              <span className="text-zinc-500">P&L</span>
              <span className={cn('ml-2 font-mono', row.totalPnl >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]')}>
                {formatPnL(row.totalPnl)}
              </span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function MarketOverview() {
  const { strategyLog, trades } = useSupabase();
  const [expandedPair, setExpandedPair] = useState<string | null>(null);

  // Build pair data from TRADES (always have pair + exchange), enriched with strategy_log when available
  const pairData = useMemo(() => {
    // Step 1: Get all unique pairs from trades
    const pairMap = new Map<string, {
      pair: string;
      exchange: 'binance' | 'delta';
      lastPrice: number;
      lastTimestamp: string;
      totalPnl: number;
      tradeCount: number;
      lastStrategy: string;
    }>();

    for (const trade of trades) {
      const key = `${trade.pair}-${trade.exchange}`;
      const existing = pairMap.get(key);
      if (!existing) {
        pairMap.set(key, {
          pair: trade.pair,
          exchange: trade.exchange,
          lastPrice: trade.price,
          lastTimestamp: trade.timestamp,
          totalPnl: trade.pnl,
          tradeCount: 1,
          lastStrategy: trade.strategy,
        });
      } else {
        existing.totalPnl += trade.pnl;
        existing.tradeCount += 1;
        if (new Date(trade.timestamp) > new Date(existing.lastTimestamp)) {
          existing.lastPrice = trade.price;
          existing.lastTimestamp = trade.timestamp;
          existing.lastStrategy = trade.strategy;
        }
      }
    }

    // Step 2: Match strategy_log entries by pair (if they have `pair` populated)
    const logByPair = new Map<string, StrategyLog>();
    for (const log of strategyLog) {
      if (log.pair) {
        const key = `${log.pair}-${log.exchange ?? 'binance'}`;
        if (!logByPair.has(key)) {
          logByPair.set(key, log);
        }
      }
    }

    // Step 3: Build rows
    const rows: PairRow[] = [];
    const pairEntries = Array.from(pairMap.entries());
    for (const [key, data] of pairEntries) {
      const log = logByPair.get(key) ?? null;
      rows.push({
        pair: data.pair,
        exchange: data.exchange,
        currentPrice: log?.current_price ?? data.lastPrice,
        priceChange15m: log?.price_change_15m ?? null,
        marketCondition: log?.market_condition ?? 'sideways',
        strategy: log?.strategy_selected ?? data.lastStrategy,
        adx: log?.adx ?? null,
        rsi: log?.rsi ?? null,
        signalStrength: log?.signal_strength ?? 0,
        lastTimestamp: log?.timestamp ?? data.lastTimestamp,
        totalPnl: data.totalPnl,
        tradeCount: data.tradeCount,
        log,
      });
    }

    // Sort by signal strength, then by trade count
    rows.sort((a, b) => (b.signalStrength - a.signalStrength) || (b.tradeCount - a.tradeCount));
    return rows;
  }, [strategyLog, trades]);

  return (
    <div className="bg-[#0d1117] border border-zinc-800 rounded-xl p-5 overflow-hidden">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
        Market Overview
      </h3>

      {pairData.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">No market data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-zinc-500 border-b border-zinc-800 uppercase tracking-wider">
                <th className="pb-2 pr-3 font-medium">Pair</th>
                <th className="pb-2 pr-3 font-medium w-6">Ex</th>
                <th className="pb-2 pr-3 font-medium text-right">Price</th>
                <th className="pb-2 pr-3 font-medium text-right">P&L</th>
                <th className="pb-2 pr-3 font-medium">Condition</th>
                <th className="pb-2 pr-3 font-medium">Strategy</th>
                <th className="pb-2 pr-3 font-medium text-right">ADX</th>
                <th className="pb-2 pr-3 font-medium text-right">RSI</th>
                <th className="pb-2 font-medium">Signal</th>
              </tr>
            </thead>
            {pairData.map((row) => {
              const condition = getConditionBadge(row.marketCondition);
              const isExpanded = expandedPair === `${row.pair}-${row.exchange}`;

              const rsi = row.rsi ?? 50;
              const rowTint =
                rsi < 40 ? 'bg-[#00c853]/[0.03]' :
                rsi > 60 ? 'bg-[#ff1744]/[0.03]' :
                'bg-transparent';

              return (
                <tbody key={`${row.pair}-${row.exchange}`}>
                  <tr
                    className={cn(
                      'border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/30 transition-colors',
                      rowTint,
                    )}
                    onClick={() => setExpandedPair(isExpanded ? null : `${row.pair}-${row.exchange}`)}
                  >
                    <td className="py-2.5 pr-3 text-white font-medium whitespace-nowrap">
                      {row.pair}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold',
                          row.exchange === 'binance'
                            ? 'bg-[#f0b90b]/10 text-[#f0b90b]'
                            : 'bg-[#00d2ff]/10 text-[#00d2ff]',
                        )}
                      >
                        {row.exchange === 'binance' ? 'B' : 'D'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-zinc-300 whitespace-nowrap">
                      {row.currentPrice != null ? `$${formatNumber(row.currentPrice)}` : '—'}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono whitespace-nowrap">
                      <span className={row.totalPnl >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}>
                        {formatPnL(row.totalPnl)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={condition.variant}>{condition.label}</Badge>
                    </td>
                    <td className="py-2.5 pr-3 text-zinc-300 text-xs">
                      {row.strategy}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-zinc-300">
                      {row.adx != null ? row.adx.toFixed(0) : '—'}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono">
                      {row.rsi != null ? (
                        <span
                          className={
                            row.rsi < 30 ? 'text-[#00c853]' :
                            row.rsi > 70 ? 'text-[#ff1744]' :
                            'text-zinc-300'
                          }
                        >
                          {row.rsi.toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <SignalBar strength={row.signalStrength} />
                    </td>
                  </tr>
                  {isExpanded && <ExpandedRow row={row} />}
                </tbody>
              );
            })}
          </table>
          {pairData.length > 0 && pairData[0].lastTimestamp && (
            <p className="text-[10px] text-zinc-600 mt-3">
              Last activity: {formatTimeAgo(pairData[0].lastTimestamp)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
