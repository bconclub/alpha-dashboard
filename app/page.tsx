'use client';

import { PnLCard } from '@/components/dashboard/PnLCard';
import { DailyPnLChart } from '@/components/charts/DailyPnLChart';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { ActiveStrategy } from '@/components/dashboard/ActiveStrategy';
import { StrategyBreakdown } from '@/components/dashboard/StrategyBreakdown';
import { CapitalTracker } from '@/components/dashboard/CapitalTracker';
import { BotStatusIndicator } from '@/components/dashboard/BotStatus';
import { ExchangeToggle } from '@/components/dashboard/ExchangeToggle';
import { ExchangeComparison } from '@/components/dashboard/ExchangeComparison';
import { OpenPositions } from '@/components/dashboard/OpenPositions';
import { FuturesPositions } from '@/components/dashboard/FuturesPositions';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <ExchangeToggle />
        </div>
        <BotStatusIndicator />
      </div>

      {/* P&L Stat Cards */}
      <PnLCard />

      {/* Exchange Comparison */}
      <ExchangeComparison />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — charts & recent trades */}
        <div className="lg:col-span-2 space-y-6">
          <DailyPnLChart />
          <OpenPositions />
          <RecentTrades />
        </div>

        {/* Right column — strategy info */}
        <div className="space-y-6">
          <ActiveStrategy />
          <StrategyBreakdown />
          <CapitalTracker />
        </div>
      </div>

      {/* Futures Positions — full width */}
      <FuturesPositions />
    </div>
  );
}
