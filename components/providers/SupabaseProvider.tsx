'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Trade, BotStatus, StrategyLog } from '@/lib/types';

interface SupabaseContextValue {
  trades: Trade[];
  recentTrades: Trade[];
  botStatus: BotStatus | null;
  strategyLog: StrategyLog[];
  isConnected: boolean;
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

const EMPTY_CONTEXT: SupabaseContextValue = {
  trades: [],
  recentTrades: [],
  botStatus: null,
  strategyLog: [],
  isConnected: false,
};

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const client = getSupabase();

  if (!client) {
    return (
      <SupabaseContext.Provider value={EMPTY_CONTEXT}>
        {children}
      </SupabaseContext.Provider>
    );
  }

  return <SupabaseProviderInner>{children}</SupabaseProviderInner>;
}

function SupabaseProviderInner({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [strategyLog, setStrategyLog] = useState<StrategyLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    async function fetchInitialData() {
      const [tradesRes, botStatusRes, strategyLogRes] = await Promise.all([
        client!
          .from('trades')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(500),
        client!
          .from('bot_status')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1),
        client!
          .from('strategy_log')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100),
      ]);

      if (tradesRes.data) setTrades(tradesRes.data as Trade[]);
      if (botStatusRes.data && botStatusRes.data.length > 0) {
        setBotStatus(botStatusRes.data[0] as BotStatus);
      }
      if (strategyLogRes.data) setStrategyLog(strategyLogRes.data as StrategyLog[]);
    }

    fetchInitialData();
  }, []);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    const channel = client
      .channel('alpha-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trades' },
        (payload) => {
          const newTrade = payload.new as Trade;
          setTrades((prev) => [newTrade, ...prev]);
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bot_status' },
        (payload) => {
          const newStatus = payload.new as BotStatus;
          setBotStatus(newStatus);
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'strategy_log' },
        (payload) => {
          const newLog = payload.new as StrategyLog;
          setStrategyLog((prev) => [newLog, ...prev]);
        },
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const recentTrades = useMemo(() => trades.slice(0, 10), [trades]);

  const value = useMemo<SupabaseContextValue>(
    () => ({
      trades,
      recentTrades,
      botStatus,
      strategyLog,
      isConnected,
    }),
    [trades, recentTrades, botStatus, strategyLog, isConnected],
  );

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase(): SupabaseContextValue {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a <SupabaseProvider>');
  }
  return context;
}
