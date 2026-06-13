/**
 * Plik: components/calendar/day-view.tsx
 * Cel: Widok dnia — lista zleceń wybranego dnia posortowana wg godziny, z kwotą,
 *      statusem i przejściem do szczegółów.
 * Zależności: lib/calendar-utils, components/orders/order-status-badge.
 */
'use client';

import { format } from 'date-fns';
import { OrderStatus } from '@prisma/client';
import { groupByDay, dayKey } from '@/lib/calendar-utils';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { formatCurrency } from '@/lib/utils';
import type { OrderListItem } from '@/types';

export function DayView({
  current,
  orders,
  onSelectOrder,
}: {
  current: Date;
  orders: OrderListItem[];
  onSelectOrder: (order: OrderListItem) => void;
}) {
  const dayOrders = (groupByDay(orders).get(dayKey(current)) ?? []).sort(
    (a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''),
  );

  if (dayOrders.length === 0) {
    return (
      <div className="rounded-lg border p-10 text-center text-muted-foreground">
        Brak zleceń w tym dniu.
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {dayOrders.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onSelectOrder(o)}
          className="flex w-full items-center gap-4 p-3 text-left hover:bg-accent"
        >
          <div className="w-14 shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
            {o.scheduledAt ? format(new Date(o.scheduledAt), 'HH:mm') : '--:--'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{o.title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {o.client
                ? `${o.client.firstName} ${o.client.lastName}`
                : 'Brak klienta'}
              {o.address ? ` · ${o.address}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <OrderStatusBadge status={o.status as OrderStatus} />
            <span className="text-sm">{formatCurrency(o.amount)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
