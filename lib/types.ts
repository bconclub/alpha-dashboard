export type Exchange = 'binance' | 'delta';
export type PositionType = 'spot' | 'long' | 'short';
export type Strategy = 'Grid' | 'Momentum' | 'Arbitrage' | 'futures_momentum';

export interface Trade {
  id: string;
  timestamp: string;
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  strategy: Strategy;
  pnl: number;
  status: 'open' | 'closed' | 'cancelled';
  exchange: Exchange;
  leverage: number;
  position_type: PositionType;
}

export interface StrategyLog {
  id: string;
  timestamp: string;
  market_condition: string;
  strategy_selected: Strategy;
  reason: string;
}

export interface BotStatus {
  id: string;
  timestamp: string;
  total_pnl: number;
  win_rate: number;
  active_strategy: Strategy;
  capital: number;
}

export interface BotCommand {
  id?: string;
  timestamp?: string;
  command: 'pause' | 'resume' | 'force_strategy';
  params: Record<string, string>;
  executed?: boolean;
}

export interface StrategyStats {
  strategy: Strategy;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_pnl: number;
  avg_duration_minutes: number;
  last_active: string;
}

// --- Supabase View Types ---

export interface OpenPosition {
  id: string;
  timestamp: string;
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  strategy: Strategy;
  pnl: number;
  exchange: Exchange;
  leverage: number;
  position_type: PositionType;
  effective_exposure: number;
}

export interface PnLByExchange {
  exchange: Exchange;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_pnl: number;
}

export interface FuturesPosition {
  id: string;
  timestamp: string;
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  strategy: Strategy;
  pnl: number;
  status: 'open' | 'closed' | 'cancelled';
  exchange: Exchange;
  leverage: number;
  position_type: PositionType;
  leveraged_pnl: number;
  leveraged_pnl_pct: number;
}

export interface DailyPnL {
  trade_date: string;
  daily_pnl: number;
  spot_pnl: number;
  futures_pnl: number;
}

export interface StrategyPerformance {
  strategy: Strategy;
  exchange: Exchange;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  total_pnl: number;
  best_trade: number;
  worst_trade: number;
}

export interface PnLByPair {
  pair: string;
  exchange: Exchange;
  position_type: PositionType;
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_pnl: number;
}

export type ExchangeFilter = 'all' | 'binance' | 'delta';
