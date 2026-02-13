-- Migration: Add indicator columns to strategy_log for trigger proximity panel
-- These columns allow the dashboard to show how close each pair is to triggering a trade

-- Add pair and exchange tracking to strategy_log
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS pair text;
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS exchange text DEFAULT 'binance';

-- Core indicator values
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS adx double precision;
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS rsi double precision;
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS signal_strength double precision;
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS current_price double precision;
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS price_change_15m double precision;

-- MACD components
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS macd_value double precision;
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS macd_signal double precision;
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS macd_histogram double precision;

-- Bollinger Bands
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS bb_upper double precision;
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS bb_lower double precision;
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS bb_middle double precision;

-- ATR and volume
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS atr double precision;
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS volume_ratio double precision;

-- Entry distance: how far RSI is from trigger (0 = at trigger, 100 = max distance)
ALTER TABLE strategy_log ADD COLUMN IF NOT EXISTS entry_distance_pct double precision;

-- Add TP/SL to trades for position progress tracking
ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss double precision;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS take_profit double precision;

-- Add richer bot_status fields
ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS binance_balance double precision DEFAULT 0;
ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS delta_balance double precision DEFAULT 0;
ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS delta_balance_inr double precision;
ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS binance_connected boolean DEFAULT false;
ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS delta_connected boolean DEFAULT false;
ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS bot_state text DEFAULT 'running';
ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS uptime_seconds integer DEFAULT 0;
ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS shorting_enabled boolean DEFAULT false;
ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS leverage_level integer DEFAULT 1;
ALTER TABLE bot_status ADD COLUMN IF NOT EXISTS active_strategies_count integer DEFAULT 0;

-- Index for faster per-pair lookups
CREATE INDEX IF NOT EXISTS idx_strategy_log_pair_ts ON strategy_log (pair, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_log_exchange ON strategy_log (exchange);
