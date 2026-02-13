'use client';

import { LiveStatusBar } from '@/components/dashboard/LiveStatusBar';
import { MarketOverview } from '@/components/dashboard/MarketOverview';
import { TriggerProximity } from '@/components/dashboard/TriggerProximity';
import { LiveActivityFeed } from '@/components/dashboard/LiveActivityFeed';
import { OpenPositions } from '@/components/dashboard/OpenPositions';
import { PerformancePanel } from '@/components/dashboard/PerformancePanel';

export default function DashboardPage() {
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

      {/* 5. Open Positions — right side concept, but full width on single page */}
      <OpenPositions />

      {/* 6. Performance — full width, collapsible */}
      <PerformancePanel />
    </div>
  );
}
