/**
 * Plik: components/calendar/day-panel.tsx
 * Cel: Panel boczny dnia (Sheet) — lista zleceń wybranego dnia z szybkim
 *      podglądem, przejściem do szczegółów i przyciskiem dodania zlecenia na
 *      ten dzień.
 * Zależności: components/ui/sheet, components/orders/*, lib/calendar-utils.
 */
'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { OrderStatus } from '@prisma/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { formatDayLabel } from '@/lib/calendar-utils';
import { formatCurrency } from '@/lib/utils';
import type { OrderListItem } from '@/types';

interface DayPanelProps {
  date: Date | null;
  orders: OrderListItem[];
  onClose: () => void;
  onAdd: (date: Date) => void;
}

export function DayPanel({ date, orders, onClose, onAdd }: DayPanelProps) {
  const total = orders.reduce((s, o) => s + Number(o.amount), 0);

  return (
    <Sheet open={!!date} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {date && (
          <>
            <SheetHeader>
              <SheetTitle className="capitalize">
                {formatDayLabel(date)}
              </SheetTitle>
              <SheetDescription>
                {orders.length} zleceń · {formatCurrency(total)}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4">
              <Button size="sm" className="w-full" onClick={() => onAdd(date)}>
                <Plus className="h-4 w-4" /> Dodaj zlecenie na ten dzień
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {orders.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Brak zleceń w tym dniu.
                </p>
              )}
              {orders
                .slice()
                .sort((a, b) =>
                  (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''),
                )
                .map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="block rounded-lg border p-3 hover:bg-accent"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{o.title}</span>
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        {o.scheduledAt
                          ? format(new Date(o.scheduledAt), 'HH:mm')
                          : ''}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {o.client
                        ? `${o.client.firstName} ${o.client.lastName}`
                        : 'Brak klienta'}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <OrderStatusBadge status={o.status as OrderStatus} />
                      <span className="text-sm">
                        {formatCurrency(o.amount)}
                      </span>
                    </div>
                  </Link>
                ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
