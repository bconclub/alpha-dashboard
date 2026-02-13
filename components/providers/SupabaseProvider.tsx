'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { getSupabase } from '@/lib/supabase';
import type {
  Trade,
  BotStatus,
  StrategyLog,
  ExchangeFilter,
  OpenPosition,
  PnLByExchange,
  FuturesPosition,
  DailyPnL,
  StrategyPerformance,
} from '@/lib/types';

interface SupabaseContextValue {
  // Core data
  trades: Trade[];
  recentTrades: Trade[];
  botStatus: BotStatus | null;
  strategyLog: StrategyLog[];
  isConnected: boolean;
  // Exchange filter
  exchangeFilter: ExchangeFilter;
  setExchangeFilter: (filter: ExchangeFilter) => void;
  filteredTrades: Trade[];
  // View data
  openPositions: OpenPosition[];
  pnlByExchange: PnLByExchange[];
  futuresPositions: FuturesPosition[];
  dailyPnL: DailyPnL[];
  strategyPerformance: StrategyPerformance[];
  // Refresh
  refreshViews: () => void;
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

const EMPTY_CONTEXT: SupabaseContextValue = {
  trades: [],
  recentTrades: [],
  botStatus: null,
  strategyLog: [],
  isConnected: false,
  exchangeFilter: 'all',
  setExchangeFilter: () => {},
  filteredTrades: [],
  openPositions: [],
  pnlByExchange: [],
  futuresPositions: [],
  dailyPnL: [],
  strategyPerformance: [],
  refreshViews: () => {},
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
  const [exchangeFilter, setExchangeFilter] = useState<ExchangeFilter>('all');

  // View data
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [pnlByExchange, setPnlByExchange] = useState<PnLByExchange[]>([]);
  const [futuresPositions, setFuturesPositions] = useState<FuturesPosition[]>([]);
  const [dailyPnL, setDailyPnL] = useState<DailyPnL[]>([]);
  const [strategyPerformance, setStrategyPerformance] = useState<StrategyPerformance[]>([]);

  // Fetch view data from Supabase views
  const fetchViews = useCallback(async () => {
    const client = getSupabase();
    if (!client) return;

    const [openRes, pnlExRes, futRes, dailyRes, stratPerfRes] = await Promise.all([
      client.from('v_open_positions').select('*'),
      client.from('v_pnl_by_exchange').select('*'),
      client.from('v_futures_positions').select('*'),
      client.from('v_daily_pnl_timeseries').select('*').order('trade_date', { ascending: true }),
      client.from('v_strategy_performance').select('*'),
    ]);

    if (openRes.data) setOpenPositions(openRes.data as OpenPosition[]);
    if (pnlExRes.data) setPnlByExchange(pnlExRes.data as PnLByExchange[]);
    if (futRes.data) setFuturesPositions(futRes.data as FuturesPosition[]);
    if (dailyRes.data) setDailyPnL(dailyRes.data as DailyPnL[]);
    if (stratPerfRes.data) setStrategyPerformance(stratPerfRes.data as StrategyPerformance[]);
  }, []);

  // Fetch initial core data
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
    fetchViews();
  }, [fetchViews]);

  // Realtime subscriptions
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
          // Refresh views when new trade arrives
          fetchViews();
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
  }, [fetchViews]);

  // Derived: filtered trades based on exchange filter
  const filteredTrades = useMemo(() => {
    if (exchangeFilter === 'all') return trades;
    return trades.filter((t) => t.exchange === exchangeFilter);
  }, [trades, exchangeFilter]);

  const recentTrades = useMemo(() => filteredTrades.slice(0, 10), [filteredTrades]);

  const value = useMemo<SupabaseContextValue>(
    () => ({
      trades,
      recentTrades,
      botStatus,
      strategyLog,
      isConnected,
      exchangeFilter,
      setExchangeFilter,
      filteredTrades,
      openPositions,
      pnlByExchange,
      futuresPositions,
      dailyPnL,
      strategyPerformance,
      refreshViews: fetchViews,
    }),
    [
      trades, recentTrades, botStatus, strategyLog, isConnected,
      exchangeFilter, filteredTrades,
      openPositions, pnlByExchange, futuresPositions, dailyPnL, strategyPerformance,
      fetchViews,
    ],
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
