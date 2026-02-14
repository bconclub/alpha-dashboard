'use client';

import { useState } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { LiveStatusBar } from '@/components/dashboard/LiveStatusBar';
import { MarketOverview } from '@/components/dashboard/MarketOverview';
import { TriggerProximity } from '@/components/dashboard/TriggerProximity';
import { LiveActivityFeed } from '@/components/dashboard/LiveActivityFeed';
import { OpenPositions } from '@/components/dashboard/OpenPositions';
import { PerformancePanel } from '@/components/dashboard/PerformancePanel';
import { ExchangeToggle } from '@/components/dashboard/ExchangeToggle';
import { AnalyticsPanel } from '@/components/dashboard/AnalyticsPanel';
import TradeTable from '@/components/tables/TradeTable';
import { cn } from '@/lib/utils';

// Lazy-load strategies page content
import StrategiesContent from './strategies/page';

type Tab = 'overview' | 'trades' | 'strategies' | 'analytics';

const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'trades', label: 'Trades' },
  { value: 'strategies', label: 'Strategies' },
  { value: 'analytics', label: 'Analytics' },
];

function ConnectionBanner() {
  const { isConnected, trades, strategyLog } = useSupabase();

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-4 py-2 flex items-center gap-3 text-xs">
      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00c853] animate-pulse' : 'bg-red-500'}`} />
      <span className="text-zinc-400">
        {isConnected ? 'Realtime connected' : 'Realtime disconnected'}
      </span>
      <span className="text-zinc-600">|</span>
      <span className="text-zinc-400">
        {trades.length} trades loaded
      </span>
      <span className="text-zinc-600">|</span>
      <span className="text-zinc-400">
        {strategyLog.length} strategy logs
      </span>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-4">
      {/* 1. Live Status Bar — full width */}
      <LiveStatusBar />

      {/* 2 & 3. Market Overview (60%) + Trigger Proximity (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <MarketOverview />
        </div>
        <div className="lg:col-span-2">
          <TriggerProximity />
        </div>
      </div>

      {/* 4. Live Activity Feed — full width */}
      <LiveActivityFeed />

      {/* 5. Open Positions */}
      <OpenPositions />

      {/* 6. Performance — full width, collapsible */}
      <PerformancePanel />
    </div>
  );
}

function TradesTab() {
  const { filteredTrades } = useSupabase();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold tracking-tight text-white">
          Trade History
        </h2>
        <ExchangeToggle />
      </div>
      <TradeTable trades={filteredTrades} />
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="space-y-4">
      {/* Connection Banner */}
      <ConnectionBanner />

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === tab.value
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {tab.label}
            {activeTab === tab.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2196f3]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'trades' && <TradesTab />}
      {activeTab === 'strategies' && <StrategiesContent />}
      {activeTab === 'analytics' && <AnalyticsPanel />}
    </div>
  );
}
