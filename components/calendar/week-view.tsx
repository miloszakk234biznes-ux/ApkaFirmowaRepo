/**
 * Plik: components/calendar/week-view.tsx
 * Cel: Widok tygodnia — 7 kolumn dni (pon–niedz) z listą zleceń, strefy
 *      upuszczania (dnd) i podsumowaniem dziennym.
 * Zależności: @dnd-kit/core, lib/calendar-utils, components/calendar/order-chip.
 */
'use client';

import { useDroppable } from '@dnd-kit/core';
import { isSameDay } from 'date-fns';
import {
  weekDays,
  groupByDay,
  dayKey,
  weekdayHeaders,
} from '@/lib/calendar-utils';
import { OrderChip } from '@/components/calendar/order-chip';
import { cn, formatCurrency } from '@/lib/utils';
import type { OrderListItem } from '@/types';

function WeekColumn({
  date,
  label,
  orders,
  onSelectDay,
  onSelectOrder,
}: {
  date: Date;
  label: string;
  orders: OrderListItem[];
  onSelectDay: (d: Date) => void;
  onSelectOrder: (o: OrderListItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dayKey(date),
    data: { date: date.toISOString() },
  });
  const today = isSameDay(date, new Date());
  const total = orders.reduce((s, o) => s + Number(o.amount), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[300px] flex-1 flex-col border-r',
        isOver && 'bg-accent',
      )}
    >
      <button
        type="button"
        onClick={() => onSelectDay(date)}
        className="border-b p-2 text-center"
      >
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={cn(
            'mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm',
            today && 'bg-primary font-semibold text-primary-foreground',
          )}
        >
          {date.getDate()}
        </div>
      </button>
      <div className="flex flex-1 flex-col gap-1 p-1">
        {orders.map((o) => (
          <OrderChip key={o.id} order={o} onClick={() => onSelectOrder(o)} />
        ))}
        {orders.length === 0 && (
          <span className="p-2 text-center text-[11px] text-muted-foreground">
            —
          </span>
        )}
      </div>
      {orders.length > 0 && (
        <div className="border-t p-1 text-center text-[11px] text-muted-foreground">
          {formatCurrency(total)}
        </div>
      )}
    </div>
  );
}

export function WeekView({
  current,
  orders,
  onSelectDay,
  onSelectOrder,
}: {
  current: Date;
  orders: OrderListItem[];
  onSelectDay: (date: Date) => void;
  onSelectOrder: (order: OrderListItem) => void;
}) {
  const days = weekDays(current);
  const grouped = groupByDay(orders);
  const headers = weekdayHeaders();

  return (
    <div className="flex overflow-x-auto rounded-lg border-l border-t">
      {days.map((date, i) => (
        <WeekColumn
          key={date.toISOString()}
          date={date}
          label={headers[i]!}
          orders={grouped.get(dayKey(date)) ?? []}
          onSelectDay={onSelectDay}
          onSelectOrder={onSelectOrder}
        />
      ))}
    </div>
  );
}
