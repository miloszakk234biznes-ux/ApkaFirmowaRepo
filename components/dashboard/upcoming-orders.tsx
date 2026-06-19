/**
 * Plik: components/dashboard/upcoming-orders.tsx
 * Cel: Lista najbliższych zleceń na pulpicie z szybką akcją „Opłacone" (bez
 *      wchodzenia w edycję) — wygodne zwłaszcza na telefonie. Po oznaczeniu
 *      płatności odświeża dane (router.refresh), więc przychód dnia aktualizuje
 *      się od razu.
 * Zależności: lib/fetcher, components/ui/*, lib/utils, next/navigation, sonner.
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { toast } from 'sonner';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/fetcher';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface UpcomingOrder {
  id: string;
  title: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  scheduledAt: string | null;
  clientName: string | null;
}

export function UpcomingOrders({ orders }: { orders: UpcomingOrder[] }) {
  const router = useRouter();
  const [payingId, setPayingId] = React.useState<string | null>(null);

  async function markPaid(id: string) {
    setPayingId(id);
    try {
      await apiRequest(`/api/orders/${id}`, 'PATCH', {
        paymentStatus: PaymentStatus.PAID,
      });
      toast.success('Oznaczono jako opłacone');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Nie udało się zapisać');
    } finally {
      setPayingId(null);
    }
  }

  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Brak zaplanowanych zleceń.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {orders.map((o) => {
        const isPaid = o.paymentStatus === PaymentStatus.PAID;
        return (
          <li
            key={o.id}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <Link
              href={`/orders/${o.id}`}
              className="min-w-0 flex-1 hover:opacity-80"
            >
              <p className="truncate font-medium">{o.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {o.clientName ?? 'Brak klienta'}
                {o.scheduledAt ? ` · ${formatDate(o.scheduledAt)}` : ''}
              </p>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <OrderStatusBadge status={o.status} />
              {isPaid ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                  <Check className="h-4 w-4" />
                  Opłacone
                </span>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={payingId === o.id}
                  onClick={() => markPaid(o.id)}
                >
                  {payingId === o.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      Opłacone
                    </>
                  )}
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
