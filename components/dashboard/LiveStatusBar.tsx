'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { formatCurrency, formatTimeAgo, cn } from '@/lib/utils';

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function UTCClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toISOString().slice(11, 19) + ' UTC',
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-xs text-zinc-400">{time}</span>
  );
}

export function LiveStatusBar() {
  const { botStatus, isConnected } = useSupabase();

  const binanceConnected = botStatus?.binance_connected ?? isConnected;
  const deltaConnected = botStatus?.delta_connected ?? isConnected;
  const botState = botStatus?.bot_state ?? (isConnected ? 'running' : 'paused');

  const binanceBalance = botStatus?.binance_balance ?? 0;
  const deltaBalance = botStatus?.delta_balance ?? 0;
  const deltaBalanceInr = botStatus?.delta_balance_inr;
  const totalCapital = botStatus?.capital ?? (binanceBalance + deltaBalance);

  const shortingEnabled = botStatus?.shorting_enabled ?? false;
  const leverageLevel = botStatus?.leverage_level ?? 1;
  const activeStrategiesCount = botStatus?.active_strategies_count ?? 0;
  const uptimeSeconds = botStatus?.uptime_seconds ?? 0;

  // Heartbeat freshness
  const lastHeartbeat = botStatus?.timestamp;
  const isStale = useMemo(() => {
    if (!lastHeartbeat) return true;
    return Date.now() - new Date(lastHeartbeat).getTime() > 120_000;
  }, [lastHeartbeat]);

  return (
    <div className="bg-[#0d1117] border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Exchange Cards */}
        <div className="flex gap-3 flex-1 min-w-0">
          {/* Binance Card */}
          <div className="flex-1 min-w-[200px] bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  binanceConnected && !isStale ? 'bg-[#00c853] animate-pulse' : 'bg-red-500',
                )}
              />
              <span className="text-sm font-semibold text-[#f0b90b]">BINANCE</span>
              <span className="text-[10px] text-zinc-500">(Spot)</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-lg text-white">{formatCurrency(binanceBalance)}</span>
              <span className="text-[10px] text-zinc-500">USDT</span>
            </div>
            {lastHeartbeat && (
              <p className="text-[10px] text-zinc-600 mt-1">{formatTimeAgo(lastHeartbeat)}</p>
            )}
          </div>

          {/* Delta Card */}
          <div className="flex-1 min-w-[200px] bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  deltaConnected && !isStale ? 'bg-[#00c853] animate-pulse' : 'bg-red-500',
                )}
              />
              <span className="text-sm font-semibold text-[#00d2ff]">DELTA</span>
              <span className="text-[10px] text-zinc-500">(Futures)</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-lg text-white">{formatCurrency(deltaBalance)}</span>
              {deltaBalanceInr != null && (
                <span className="text-[10px] text-zinc-500">~INR {deltaBalanceInr.toLocaleString()}</span>
              )}
            </div>
            {lastHeartbeat && (
              <p className="text-[10px] text-zinc-600 mt-1">{formatTimeAgo(lastHeartbeat)}</p>
            )}
          </div>
        </div>

        {/* Center: Total Capital + Bot State */}
        <div className="flex flex-col items-center gap-1 px-6 border-x border-zinc-800">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Total Capital</span>
          <span className="font-mono text-xl font-bold text-white">
            {formatCurrency(totalCapital)}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                botState === 'running'
                  ? 'bg-[#00c853]/10 text-[#00c853]'
                  : 'bg-[#ffd600]/10 text-[#ffd600]',
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  botState === 'running' ? 'bg-[#00c853]' : 'bg-[#ffd600]',
                )}
              />
              {botState === 'running' ? 'Running' : 'Paused'}
            </span>
            {uptimeSeconds > 0 && (
              <span className="text-[10px] text-zinc-500">{formatUptime(uptimeSeconds)}</span>
            )}
          </div>
        </div>

        {/* Right: Indicators + Clock */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5 text-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Shorting</span>
              <span className={shortingEnabled ? 'text-[#00c853]' : 'text-zinc-600'}>
                {shortingEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Leverage</span>
              <span className="text-[#ffd600] font-mono">{leverageLevel}x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Strategies</span>
              <span className="text-[#2196f3] font-mono">{activeStrategiesCount}</span>
            </div>
          </div>
          <div className="border-l border-zinc-800 pl-4">
            <UTCClock />
          </div>
        </div>
      </div>
    </div>
  );
}
