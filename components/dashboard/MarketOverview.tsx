'use client';

import { useMemo, useState } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { Badge } from '@/components/ui/Badge';
import { formatNumber, formatPercentage, formatTimeAgo, cn } from '@/lib/utils';
import type { StrategyLog } from '@/lib/types';

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

function ExpandedRow({ log }: { log: StrategyLog }) {
  return (
    <tr>
      <td colSpan={9} className="p-0">
        <div className="bg-zinc-900/60 border-t border-zinc-800 px-6 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
            {log.macd_value != null && (
              <div>
                <span className="text-zinc-500">MACD</span>
                <span className="ml-2 font-mono text-zinc-300">{log.macd_value.toFixed(4)}</span>
              </div>
            )}
            {log.macd_signal != null && (
              <div>
                <span className="text-zinc-500">Signal</span>
                <span className="ml-2 font-mono text-zinc-300">{log.macd_signal.toFixed(4)}</span>
              </div>
            )}
            {log.macd_histogram != null && (
              <div>
                <span className="text-zinc-500">Histogram</span>
                <span className={cn('ml-2 font-mono', log.macd_histogram >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]')}>
                  {log.macd_histogram.toFixed(4)}
                </span>
              </div>
            )}
            {log.bb_upper != null && (
              <div>
                <span className="text-zinc-500">BB Upper</span>
                <span className="ml-2 font-mono text-zinc-300">{formatNumber(log.bb_upper)}</span>
              </div>
            )}
            {log.bb_lower != null && (
              <div>
                <span className="text-zinc-500">BB Lower</span>
                <span className="ml-2 font-mono text-zinc-300">{formatNumber(log.bb_lower)}</span>
              </div>
            )}
            {log.atr != null && (
              <div>
                <span className="text-zinc-500">ATR</span>
                <span className="ml-2 font-mono text-zinc-300">{log.atr.toFixed(2)}</span>
              </div>
            )}
            {log.volume_ratio != null && (
              <div>
                <span className="text-zinc-500">Vol Ratio</span>
                <span className="ml-2 font-mono text-zinc-300">{log.volume_ratio.toFixed(2)}x</span>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export function MarketOverview() {
  const { strategyLog } = useSupabase();
  const [expandedPair, setExpandedPair] = useState<string | null>(null);

  // Get latest log per pair, sorted by signal strength
  const pairData = useMemo(() => {
    const latestByPair = new Map<string, StrategyLog>();
    for (const log of strategyLog) {
      const key = log.pair ?? 'unknown';
      if (!latestByPair.has(key)) {
        latestByPair.set(key, log);
      }
    }
    const entries = Array.from(latestByPair.values());
    entries.sort((a, b) => (b.signal_strength ?? 0) - (a.signal_strength ?? 0));
    return entries;
  }, [strategyLog]);

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
                <th className="pb-2 pr-3 font-medium text-right">15m %</th>
                <th className="pb-2 pr-3 font-medium">Condition</th>
                <th className="pb-2 pr-3 font-medium">Strategy</th>
                <th className="pb-2 pr-3 font-medium text-right">ADX</th>
                <th className="pb-2 pr-3 font-medium text-right">RSI</th>
                <th className="pb-2 font-medium">Signal</th>
              </tr>
            </thead>
            <tbody>
              {pairData.map((log) => {
                const pairKey = log.pair ?? 'unknown';
                const condition = getConditionBadge(log.market_condition);
                const isExpanded = expandedPair === pairKey;

                // Row tint
                const rsi = log.rsi ?? 50;
                const rowTint =
                  rsi < 40 ? 'bg-[#00c853]/[0.03]' :
                  rsi > 60 ? 'bg-[#ff1744]/[0.03]' :
                  'bg-transparent';

                return (
                  <tbody key={pairKey}>
                    <tr
                      className={cn(
                        'border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/30 transition-colors',
                        rowTint,
                      )}
                      onClick={() => setExpandedPair(isExpanded ? null : pairKey)}
                    >
                      <td className="py-2.5 pr-3 text-white font-medium whitespace-nowrap">
                        {pairKey}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold',
                            log.exchange === 'binance'
                              ? 'bg-[#f0b90b]/10 text-[#f0b90b]'
                              : 'bg-[#00d2ff]/10 text-[#00d2ff]',
                          )}
                        >
                          {log.exchange === 'binance' ? 'B' : 'D'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-zinc-300 whitespace-nowrap">
                        {log.current_price != null ? `$${formatNumber(log.current_price)}` : '—'}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono whitespace-nowrap">
                        {log.price_change_15m != null ? (
                          <span className={log.price_change_15m >= 0 ? 'text-[#00c853]' : 'text-[#ff1744]'}>
                            {formatPercentage(log.price_change_15m)}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge variant={condition.variant}>{condition.label}</Badge>
                      </td>
                      <td className="py-2.5 pr-3 text-zinc-300 text-xs">
                        {log.strategy_selected}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-zinc-300">
                        {log.adx != null ? log.adx.toFixed(0) : '—'}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono">
                        {log.rsi != null ? (
                          <span
                            className={
                              log.rsi < 30 ? 'text-[#00c853]' :
                              log.rsi > 70 ? 'text-[#ff1744]' :
                              'text-zinc-300'
                            }
                          >
                            {log.rsi.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <SignalBar strength={log.signal_strength ?? 0} />
                      </td>
                    </tr>
                    {isExpanded && <ExpandedRow log={log} />}
                  </tbody>
                );
              })}
            </tbody>
          </table>
          {pairData.length > 0 && pairData[0].timestamp && (
            <p className="text-[10px] text-zinc-600 mt-3">
              Last analysis: {formatTimeAgo(pairData[0].timestamp)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
