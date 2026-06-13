/**
 * Plik: components/calendar/day-cell.tsx
 * Cel: Pojedyncza komórka dnia w siatce miesiąca — strefa upuszczania (dnd),
 *      numer dnia, kropki/kafelki zleceń, licznik i suma wartości (tooltip).
 * Zależności: @dnd-kit/core, components/calendar/order-chip, lib/utils.
 */
'use client';

import { useDroppable } from '@dnd-kit/core';
import { isSameDay, isSameMonth } from 'date-fns';
import { OrderChip } from '@/components/calendar/order-chip';
import { dayKey } from '@/lib/calendar-utils';
import { cn, formatCurrency } from '@/lib/utils';
import type { OrderListItem } from '@/types';

interface DayCellProps {
  date: Date;
  month: Date;
  orders: OrderListItem[];
  onSelectDay: (date: Date) => void;
  onSelectOrder: (order: OrderListItem) => void;
}

export function DayCell({
  date,
  month,
  orders,
  onSelectDay,
  onSelectOrder,
}: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: dayKey(date),
    data: { date: date.toISOString() },
  });
  const inMonth = isSameMonth(date, month);
  const today = isSameDay(date, new Date());
  const total = orders.reduce((s, o) => s + Number(o.amount), 0);
  const visible = orders.slice(0, 3);
  const extra = orders.length - visible.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[96px] flex-col gap-1 border-b border-r p-1.5 transition-colors',
        !inMonth && 'bg-muted/40 text-muted-foreground',
        isOver && 'bg-accent',
      )}
    >
      <button
        type="button"
        onClick={() => onSelectDay(date)}
        className="flex items-center justify-between text-left"
      >
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-sm',
            today && 'bg-primary font-semibold text-primary-foreground',
          )}
        >
          {date.getDate()}
        </span>
        {orders.length > 0 && (
          <span
            className="text-[10px] text-muted-foreground"
            title={`${orders.length} zleceń · ${formatCurrency(total)}`}
          >
            {orders.length} · {formatCurrency(total)}
          </span>
        )}
      </button>

      <div className="flex flex-col gap-0.5">
        {visible.map((o) => (
          <OrderChip key={o.id} order={o} onClick={() => onSelectOrder(o)} />
        ))}
        {extra > 0 && (
          <button
            type="button"
            onClick={() => onSelectDay(date)}
            className="px-1 text-left text-[11px] text-muted-foreground hover:underline"
          >
            +{extra} więcej
          </button>
        )}
      </div>
    </div>
  );
}
