/**
 * Plik: components/map/map-shell.tsx
 * Cel: Widok mapy dnia — wybór daty, pobranie zleceń dnia (SWR) i przekazanie do
 *      OrdersMap. RBAC scope egzekwowany przez API zleceń.
 * Zależności: hooks/use-orders, components/map/orders-map, components/ui/*.
 */
'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { useCalendarOrders } from '@/hooks/use-orders';
import { rangeForDay, formatDayLabel } from '@/lib/calendar-utils';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// Mapa ładowana leniwie (zależna od window / Google Maps).
const OrdersMap = dynamic(
  () => import('@/components/map/orders-map').then((m) => m.OrdersMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] w-full rounded-lg" />,
  },
);

export function MapShell() {
  const [date, setDate] = React.useState(() => new Date());
  const range = rangeForDay(date);
  const { orders, isLoading } = useCalendarOrders(range.from, range.to);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDate((d) => addDays(d, -1))}
          aria-label="Poprzedni dzień"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDate((d) => addDays(d, 1))}
          aria-label="Następny dzień"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          className="w-44"
          value={format(date, 'yyyy-MM-dd')}
          onChange={(e) => e.target.value && setDate(new Date(e.target.value))}
        />
        <span className="text-sm capitalize text-muted-foreground">
          {formatDayLabel(date)}
        </span>
      </div>

      {isLoading ? (
        <Skeleton className="h-[420px] w-full rounded-lg" />
      ) : (
        <OrdersMap orders={orders} />
      )}
    </div>
  );
}
