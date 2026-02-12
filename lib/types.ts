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
}

export type Strategy = 'Grid' | 'Momentum' | 'Arbitrage';

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
