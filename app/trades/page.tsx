'use client';

import { useSupabase } from '@/components/providers/SupabaseProvider';
import TradeTable from '@/components/tables/TradeTable';

export default function TradesPage() {
  const { trades } = useSupabase();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">
        Trade History
      </h1>

      <TradeTable trades={trades} />
    </div>
  );
}
