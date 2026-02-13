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
}

function computeTrigger(log: StrategyLog): TriggerInfo {
  const rsi = log.rsi ?? null;
  const isFutures = log.exchange === 'delta';
  const pair = log.pair ?? 'Unknown';

  // For futures, check both long (RSI<30) and short (RSI>70)
  // Pick whichever is closer
  let rsiTarget = 30;
  let rsiDirection: 'buy' | 'short' = 'buy';
  let rsiDistancePct = 100;

  if (rsi != null) {
    const buyDistance = Math.max(0, ((rsi - 30) / 70) * 100); // % away from RSI 30
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

  // Use entry_distance_pct if provided
  if (log.entry_distance_pct != null) {
    rsiDistancePct = log.entry_distance_pct;
  }

  // MACD status
  let macdStatus = 'No data';
  if (log.macd_histogram != null) {
    const hist = log.macd_histogram;
    if (Math.abs(hist) < 0.0005) {
      macdStatus = 'Converging — possible cross soon';
    } else if (hist > 0) {
      macdStatus = 'Bullish — above signal';
    } else {
      macdStatus = 'Bearish — below signal';
    }
  }

  // Overall status
  let overallStatus = 'Watching';
  let statusColor = 'text-zinc-400';
  let nextAction = 'No signal expected soon';

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

  return {
    pair,
    exchange: log.exchange,
    rsi,
    rsiTarget,
    rsiDirection,
    rsiDistancePct,
    macdStatus,
    overallStatus,
    statusColor,
    nextAction,
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
  const { strategyLog } = useSupabase();

  const triggers = useMemo(() => {
    const latestByPair = new Map<string, StrategyLog>();
    for (const log of strategyLog) {
      const key = log.pair ?? 'unknown';
      if (!latestByPair.has(key)) {
        latestByPair.set(key, log);
      }
    }
    return Array.from(latestByPair.values())
      .map(computeTrigger)
      .sort((a, b) => a.rsiDistancePct - b.rsiDistancePct);
  }, [strategyLog]);

  return (
    <div className="bg-[#0d1117] border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
        What Could Trigger Next
      </h3>

      {triggers.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">No analysis data</p>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {triggers.map((t) => (
            <div
              key={t.pair}
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
              {t.rsi != null && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">
                      RSI: <span className="font-mono text-zinc-300">{t.rsi.toFixed(0)}</span>
                      {' → need '}
                      {t.rsiDirection === 'short' ? '>' : '<'}
                      {t.rsiTarget} for {t.rsiDirection}
                    </span>
                  </div>
                  <ProximityBar distance={t.rsiDistancePct} />
                </div>
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
