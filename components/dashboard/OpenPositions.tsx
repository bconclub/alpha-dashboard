'use client';

import { useSupabase } from '@/components/providers/SupabaseProvider';
import { Badge } from '@/components/ui/Badge';
import {
  formatCurrency,
  formatNumber,
  formatLeverage,
  getExchangeLabel,
  getExchangeColor,
  getPositionTypeLabel,
  getPositionTypeColor,
  cn,
} from '@/lib/utils';

export function OpenPositions() {
  const { openPositions } = useSupabase();

  return (
    <div className="bg-card border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
        Open Positions
      </h3>

      {!openPositions || openPositions.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">No open positions</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800">
                <th className="pb-2 pr-3 font-medium">Pair</th>
                <th className="pb-2 pr-3 font-medium">Exchange</th>
                <th className="pb-2 pr-3 font-medium">Side</th>
                <th className="pb-2 pr-3 font-medium">Type</th>
                <th className="pb-2 pr-3 font-medium">Leverage</th>
                <th className="pb-2 pr-3 font-medium text-right">Entry Price</th>
                <th className="pb-2 font-medium text-right">Exposure</th>
              </tr>
            </thead>
            <tbody>
              {openPositions.map((pos, index) => {
                const leverageStr = formatLeverage(pos.leverage);

                return (
                  <tr
                    key={pos.id}
                    className={cn(
                      'border-b border-zinc-800/50 last:border-0',
                      index % 2 === 0 ? 'bg-transparent' : 'bg-zinc-900/30'
                    )}
                  >
                    <td className="py-2.5 pr-3 text-white font-medium whitespace-nowrap">
                      {pos.pair}
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: getExchangeColor(pos.exchange) }}
                        />
                        <span className="text-zinc-300">{getExchangeLabel(pos.exchange)}</span>
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={pos.side === 'buy' ? 'success' : 'danger'}>
                        {pos.side.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={cn('text-xs font-medium', getPositionTypeColor(pos.position_type))}>
                        {getPositionTypeLabel(pos.position_type)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      {pos.leverage > 1 ? (
                        <Badge variant="warning">{leverageStr}</Badge>
                      ) : (
                        <span className="text-zinc-600">&mdash;</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono text-zinc-300 whitespace-nowrap">
                      {formatNumber(pos.price)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-zinc-300 whitespace-nowrap">
                      {formatCurrency(pos.effective_exposure)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
