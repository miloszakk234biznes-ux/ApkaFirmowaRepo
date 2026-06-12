/**
 * Plik: components/calendar/month-view.tsx
 * Cel: Widok miesiąca — siatka 7 kolumn z komórkami dni i kafelkami zleceń.
 * Zależności: lib/calendar-utils, components/calendar/day-cell.
 */
'use client';

import {
  monthGrid,
  groupByDay,
  dayKey,
  weekdayHeaders,
} from '@/lib/calendar-utils';
import { DayCell } from '@/components/calendar/day-cell';
import type { OrderListItem } from '@/types';

interface MonthViewProps {
  current: Date;
  orders: OrderListItem[];
  onSelectDay: (date: Date) => void;
  onSelectOrder: (order: OrderListItem) => void;
}

export function MonthView({
  current,
  orders,
  onSelectDay,
  onSelectOrder,
}: MonthViewProps) {
  const days = monthGrid(current);
  const grouped = groupByDay(orders);

  return (
    <div className="overflow-hidden rounded-lg border-l border-t">
      <div className="grid grid-cols-7 bg-muted/50">
        {weekdayHeaders().map((d) => (
          <div
            key={d}
            className="border-b border-r p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date) => (
          <DayCell
            key={date.toISOString()}
            date={date}
            month={current}
            orders={grouped.get(dayKey(date)) ?? []}
            onSelectDay={onSelectDay}
            onSelectOrder={onSelectOrder}
          />
        ))}
      </div>
    </div>
  );
}
