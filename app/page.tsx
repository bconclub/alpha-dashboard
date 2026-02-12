'use client';

import { PnLCard } from '@/components/dashboard/PnLCard';
import { PnLChart } from '@/components/charts/PnLChart';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { ActiveStrategy } from '@/components/dashboard/ActiveStrategy';
import { StrategyBreakdown } from '@/components/dashboard/StrategyBreakdown';
import { CapitalTracker } from '@/components/dashboard/CapitalTracker';
import { LivePriceChart } from '@/components/dashboard/LivePriceChart';
import { BotStatusIndicator } from '@/components/dashboard/BotStatus';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Dashboard
        </h1>
        <BotStatusIndicator />
      </div>

      {/* P&L Stat Cards */}
      <PnLCard />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — charts & recent trades */}
        <div className="lg:col-span-2 space-y-6">
          <PnLChart />
          <RecentTrades />
        </div>

        {/* Right column — strategy info */}
        <div className="space-y-6">
          <ActiveStrategy />
          <StrategyBreakdown />
          <CapitalTracker />
        </div>
      </div>

      {/* Bottom — full-width price chart */}
      <LivePriceChart />
    </div>
  );
}
