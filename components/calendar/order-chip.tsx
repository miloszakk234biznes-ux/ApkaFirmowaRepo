/**
 * Plik: components/calendar/order-chip.tsx
 * Cel: Przeciągalny „kafelek" zlecenia w kalendarzu (godzina + tytuł + kropka
 *      statusu). Kliknięcie otwiera panel/szczegóły; przeciągnięcie przenosi
 *      zlecenie na inny dzień (dnd-kit).
 * Zależności: @dnd-kit/core, lib/constants, lib/utils, types.
 */
'use client';

import { useDraggable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { OrderStatus } from '@prisma/client';
import { ORDER_STATUS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { OrderListItem } from '@/types';

interface OrderChipProps {
  order: OrderListItem;
  onClick?: () => void;
}

export function OrderChip({ order, onClick }: OrderChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
    data: { order },
  });
  const meta = ORDER_STATUS[order.status as OrderStatus];
  const time = order.scheduledAt
    ? format(new Date(order.scheduledAt), 'HH:mm')
    : '';

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      {...listeners}
      {...attributes}
      className={cn(
        'flex w-full items-center gap-1 truncate rounded px-1.5 py-1 text-left text-xs',
        'border bg-card hover:bg-accent',
        isDragging && 'opacity-50',
      )}
      title={`${time} ${order.title}`}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} />
      {time && <span className="shrink-0 tabular-nums">{time}</span>}
      <span className="truncate">{order.title}</span>
    </button>
  );
}
