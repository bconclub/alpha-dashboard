'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
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
  ActivityEvent,
  ActivityEventType,
} from '@/lib/types';

interface SupabaseContextValue {
  trades: Trade[];
  recentTrades: Trade[];
  botStatus: BotStatus | null;
  strategyLog: StrategyLog[];
  isConnected: boolean;
  exchangeFilter: ExchangeFilter;
  setExchangeFilter: (filter: ExchangeFilter) => void;
  filteredTrades: Trade[];
  openPositions: OpenPosition[];
  pnlByExchange: PnLByExchange[];
  futuresPositions: FuturesPosition[];
  dailyPnL: DailyPnL[];
  strategyPerformance: StrategyPerformance[];
  activityFeed: ActivityEvent[];
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
  activityFeed: [],
  refreshViews: () => {},
};

function buildActivityEvent(
  type: ActivityEventType,
  source: Trade | StrategyLog,
  description: string,
): ActivityEvent {
  return {
    id: source.id,
    timestamp: source.timestamp,
    pair: 'pair' in source ? source.pair : '',
    eventType: type,
    description,
    exchange: 'exchange' in source ? source.exchange : undefined,
  };
}

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
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);

  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [pnlByExchange, setPnlByExchange] = useState<PnLByExchange[]>([]);
  const [futuresPositions, setFuturesPositions] = useState<FuturesPosition[]>([]);
  const [dailyPnL, setDailyPnL] = useState<DailyPnL[]>([]);
  const [strategyPerformance, setStrategyPerformance] = useState<StrategyPerformance[]>([]);

  const activityRef = useRef<ActivityEvent[]>([]);

  const pushActivity = useCallback((event: ActivityEvent) => {
    activityRef.current = [event, ...activityRef.current].slice(0, 50);
    setActivityFeed([...activityRef.current]);
  }, []);

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

  const buildInitialFeed = useCallback((trades: Trade[], logs: StrategyLog[]) => {
    const events: ActivityEvent[] = [];

    // Trades always have pair and exchange — reliable source
    for (const trade of trades.slice(0, 40)) {
      const exchangeLabel = trade.exchange === 'delta' ? ' on Delta' : '';
      if (trade.status === 'open') {
        const isFuturesShort = trade.position_type === 'short';
        const type: ActivityEventType = isFuturesShort ? 'short_open' : 'trade_open';
        const label = isFuturesShort
          ? `SHORT ${trade.pair} @ $${trade.price.toLocaleString()}${exchangeLabel}`
          : `${trade.side.toUpperCase()} ${trade.pair} @ $${trade.price.toLocaleString()} — ${trade.strategy}`;
        events.push(buildActivityEvent(type, trade, label));
      } else if (trade.status === 'closed') {
        const pnlLabel = trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
        events.push(
          buildActivityEvent('trade_close', trade, `${trade.pair} closed — ${pnlLabel} P&L`),
        );
      }
    }

    // Strategy logs — include all, use pair if available
    for (const log of logs.slice(0, 20)) {
      const pairLabel = log.pair || 'Market';
      events.push(
        buildActivityEvent(
          'analysis',
          log,
          `${pairLabel} analyzed — ${log.market_condition}, strategy: ${log.strategy_selected}`,
        ),
      );
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    activityRef.current = events.slice(0, 50);
    setActivityFeed([...activityRef.current]);
  }, []);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    async function fetchInitialData() {
      const [tradesRes, botStatusRes, strategyLogRes] = await Promise.all([
        client!.from('trades').select('*').order('timestamp', { ascending: false }).limit(500),
        client!.from('bot_status').select('*').order('timestamp', { ascending: false }).limit(1),
        client!.from('strategy_log').select('*').order('timestamp', { ascending: false }).limit(100),
      ]);

      const tradeData = (tradesRes.data ?? []) as Trade[];
      const logData = (strategyLogRes.data ?? []) as StrategyLog[];

      setTrades(tradeData);
      if (botStatusRes.data && botStatusRes.data.length > 0) {
        setBotStatus(botStatusRes.data[0] as BotStatus);
      }
      setStrategyLog(logData);
      buildInitialFeed(tradeData, logData);
    }

    fetchInitialData();
    fetchViews();
  }, [fetchViews, buildInitialFeed]);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    const channel = client
      .channel('alpha-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trades' }, (payload) => {
        const t = payload.new as Trade;
        setTrades((prev) => [t, ...prev]);
        fetchViews();

        if (t.status === 'open') {
          const isFuturesShort = t.position_type === 'short';
          pushActivity(
            buildActivityEvent(
              isFuturesShort ? 'short_open' : 'trade_open',
              t,
              isFuturesShort
                ? `SHORT ${t.pair} @ $${t.price.toLocaleString()} on ${t.exchange}`
                : `LONG ${t.pair} @ $${t.price.toLocaleString()} — RSI signal`,
            ),
          );
        } else if (t.status === 'closed') {
          const pctLabel = t.pnl >= 0 ? `+${t.pnl.toFixed(2)}%` : `${t.pnl.toFixed(2)}%`;
          pushActivity(buildActivityEvent('trade_close', t, `${t.pair} ${pctLabel} profit closed`));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trades' }, (payload) => {
        const updated = payload.new as Trade;
        setTrades((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        fetchViews();

        if (updated.status === 'closed') {
          const pctLabel = updated.pnl >= 0 ? `+${updated.pnl.toFixed(2)}%` : `${updated.pnl.toFixed(2)}%`;
          pushActivity(buildActivityEvent('trade_close', updated, `${updated.pair} ${pctLabel} closed`));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bot_status' }, (payload) => {
        setBotStatus(payload.new as BotStatus);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'strategy_log' }, (payload) => {
        const log = payload.new as StrategyLog;
        setStrategyLog((prev) => [log, ...prev]);

        pushActivity(
          buildActivityEvent(
            'analysis',
            log,
            `${log.pair ?? 'Market'} — ${log.market_condition}, ${log.strategy_selected}${log.adx ? `, ADX=${log.adx.toFixed(0)}` : ''}${log.rsi ? `, RSI=${log.rsi.toFixed(0)}` : ''}`,
          ),
        );
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [fetchViews, pushActivity]);

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
      activityFeed,
      refreshViews: fetchViews,
    }),
    [
      trades, recentTrades, botStatus, strategyLog, isConnected,
      exchangeFilter, filteredTrades,
      openPositions, pnlByExchange, futuresPositions, dailyPnL, strategyPerformance,
      activityFeed, fetchViews,
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
