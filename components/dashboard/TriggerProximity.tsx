'use client';

import { useMemo } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { cn } from '@/lib/utils';
import type { StrategyLog, Exchange } from '@/lib/types';

interface TriggerInfo {
  pair: string;
  exchange: Exchange;
  rsi: number | null;
  rsiTarget: number;
  rsiDirection: 'buy' | 'short';
  rsiDistancePct: number;
  macdStatus: string;
  overallStatus: string;
  statusColor: string;
  nextAction: string;
  hasIndicatorData: boolean;
}

function computeTrigger(pair: string, exchange: Exchange, log: StrategyLog | null): TriggerInfo {
  const rsi = log?.rsi ?? null;
  const isFutures = exchange === 'delta';

  let rsiTarget = 30;
  let rsiDirection: 'buy' | 'short' = 'buy';
  let rsiDistancePct = 100;

  if (rsi != null) {
    const buyDistance = Math.max(0, ((rsi - 30) / 70) * 100);
    const shortDistance = isFutures ? Math.max(0, ((70 - rsi) / 70) * 100) : 100;

    if (isFutures && shortDistance < buyDistance) {
      rsiTarget = 70;
      rsiDirection = 'short';
      rsiDistancePct = shortDistance;
    } else {
      rsiTarget = 30;
      rsiDirection = 'buy';
      rsiDistancePct = buyDistance;
    }
  }

  if (log?.entry_distance_pct != null) {
    rsiDistancePct = log.entry_distance_pct;
  }

  let macdStatus = 'No data';
  if (log?.macd_histogram != null) {
    const hist = log.macd_histogram;
    if (Math.abs(hist) < 0.0005) {
      macdStatus = 'Converging — possible cross soon';
    } else if (hist > 0) {
      macdStatus = 'Bullish — above signal';
    } else {
      macdStatus = 'Bearish — below signal';
    }
  }

  let overallStatus = 'Watching';
  let statusColor = 'text-zinc-400';
  let nextAction = 'Monitoring — waiting for signals';

  if (rsi != null) {
    if (rsiDistancePct < 15) {
      overallStatus = 'Imminent';
      statusColor = 'text-[#00c853]';
      nextAction = `${rsiDirection === 'short' ? 'Short' : 'Buy'} signal very close — RSI near ${rsiTarget}`;
    } else if (rsiDistancePct < 40) {
      overallStatus = 'Getting close';
      statusColor = 'text-[#ffd600]';
      nextAction = `${rsiDirection === 'short' ? 'Short' : 'Buy'} possible in ${rsiDistancePct < 25 ? '1-2' : '2-3'} candles`;
    } else {
      overallStatus = 'Watching';
      statusColor = 'text-zinc-500';
      nextAction = `Far from ${rsiDirection === 'short' ? 'short' : 'buy'} trigger — monitoring`;
    }
  }

  return {
    pair,
    exchange,
    rsi,
    rsiTarget,
    rsiDirection,
    rsiDistancePct,
    macdStatus,
    overallStatus,
    statusColor,
    nextAction,
    hasIndicatorData: rsi != null,
  };
}

function ProximityBar({ distance }: { distance: number }) {
  const filled = Math.max(0, Math.min(100, 100 - distance));
  const color =
    distance < 15 ? '#00c853' :
    distance < 40 ? '#ffd600' :
    '#ff1744';

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${filled}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-mono text-zinc-500 w-14 text-right">
        {distance.toFixed(0)}% away
      </span>
    </div>
  );
}

export function TriggerProximity() {
  const { strategyLog, trades } = useSupabase();

  const triggers = useMemo(() => {
    // Get unique pairs from trades
    const pairExchanges = new Map<string, { pair: string; exchange: Exchange }>();
    for (const t of trades) {
      const key = `${t.pair}-${t.exchange}`;
      if (!pairExchanges.has(key)) {
        pairExchanges.set(key, { pair: t.pair, exchange: t.exchange });
      }
    }

    // Match strategy_log entries by pair
    const logByPair = new Map<string, StrategyLog>();
    for (const log of strategyLog) {
      if (log.pair) {
        const key = `${log.pair}-${log.exchange ?? 'binance'}`;
        if (!logByPair.has(key)) {
          logByPair.set(key, log);
        }
      }
    }

    // Build triggers for all pairs
    const results: TriggerInfo[] = [];
    const pairEntries = Array.from(pairExchanges.entries());
    for (const [key, { pair, exchange }] of pairEntries) {
      const log = logByPair.get(key) ?? null;
      results.push(computeTrigger(pair, exchange, log));
    }

    // Sort: pairs with indicator data first, then by distance
    results.sort((a, b) => {
      if (a.hasIndicatorData && !b.hasIndicatorData) return -1;
      if (!a.hasIndicatorData && b.hasIndicatorData) return 1;
      return a.rsiDistancePct - b.rsiDistancePct;
    });

    return results;
  }, [strategyLog, trades]);

  return (
    <div className="bg-[#0d1117] border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
        What Could Trigger Next
      </h3>

      {triggers.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">No pairs tracked yet</p>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {triggers.map((t) => (
            <div
              key={`${t.pair}-${t.exchange}`}
              className="bg-zinc-900/40 border border-zinc-800/50 rounded-lg p-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{t.pair}</span>
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold',
                      t.exchange === 'binance'
                        ? 'bg-[#f0b90b]/10 text-[#f0b90b]'
                        : 'bg-[#00d2ff]/10 text-[#00d2ff]',
                    )}
                  >
                    {t.exchange === 'binance' ? 'B' : 'D'}
                  </span>
                </div>
                <span className={cn('text-xs font-medium', t.statusColor)}>
                  {t.overallStatus}
                </span>
              </div>

              {/* RSI proximity */}
              {t.rsi != null ? (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">
                      RSI: <span className="font-mono text-zinc-300">{t.rsi.toFixed(0)}</span>
                      {' \u2192 need '}
                      {t.rsiDirection === 'short' ? '>' : '<'}
                      {t.rsiTarget} for {t.rsiDirection}
                    </span>
                  </div>
                  <ProximityBar distance={t.rsiDistancePct} />
                </div>
              ) : (
                <p className="text-[11px] text-zinc-600 mb-2">Awaiting indicator data from bot...</p>
              )}

              {/* MACD */}
              <div className="text-[11px] text-zinc-500 mb-1">
                MACD: <span className="text-zinc-400">{t.macdStatus}</span>
              </div>

              {/* Next action */}
              <p className="text-[10px] text-zinc-600 italic">{t.nextAction}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
