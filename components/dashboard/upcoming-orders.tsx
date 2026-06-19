/**
 * Plik: components/dashboard/upcoming-orders.tsx
 * Cel: Lista zleceń dnia na pulpicie z kwotą oraz szybkimi akcjami: „Opłacone"
 *      (oznacza płatność bez wchodzenia w edycję) i „Trasa" (otwiera nawigację
 *      Google Maps do adresu zlecenia). Wygodne zwłaszcza na telefonie. Po
 *      oznaczeniu płatności odświeża dane (router.refresh), więc przychód dnia
 *      aktualizuje się od razu.
 * Zależności: lib/fetcher, components/ui/*, lib/utils, next/navigation, sonner.
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Navigation } from 'lucide-react';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/fetcher';
import { cn, formatCurrency } from '@/lib/utils';

export interface UpcomingOrder {
  id: string;
  title: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  address: string | null;
  scheduledAt: string | null;
  clientName: string | null;
}

/** Deeplink nawigacji Google Maps do pojedynczego adresu (trasa z lokalizacji). */
function routeDeeplink(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address,
  )}`;
}

/** Godzina zlecenia (HH:mm) z ISO, jeśli jest termin. */
function timeLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

export function UpcomingOrders({
  orders,
  emptyText = 'Brak zleceń.',
}: {
  orders: UpcomingOrder[];
  emptyText?: string;
}) {
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
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="divide-y">
      {orders.map((o) => {
        const isPaid = o.paymentStatus === PaymentStatus.PAID;
        const time = timeLabel(o.scheduledAt);
        return (
          <li key={o.id} className="space-y-2 py-3">
            {/* Górny wiersz: godzina + tytuł + klient + adres, a po prawej kwota. */}
            <div className="flex items-start justify-between gap-3">
              <Link
                href={`/orders/${o.id}`}
                className="flex min-w-0 flex-1 items-start gap-2 hover:opacity-80"
              >
                {time && (
                  <span className="mt-0.5 shrink-0 rounded-md bg-muted px-2 py-1 text-sm font-semibold tabular-nums">
                    {time}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-medium">{o.title}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {o.clientName ?? 'Brak klienta'}
                  </span>
                  {o.address && (
                    <span className="block truncate text-sm text-muted-foreground">
                      {o.address}
                    </span>
                  )}
                </span>
              </Link>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatCurrency(o.amount)}
              </span>
            </div>

            {/* Dolny wiersz: akcje. */}
            <div className="flex items-center gap-2">
              {isPaid ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-700">
                  <Check className="h-4 w-4" />
                  Opłacone
                </span>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={payingId === o.id}
                  onClick={() => markPaid(o.id)}
                  className="bg-green-600 text-white hover:bg-green-700"
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

              {o.address ? (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-gray-300 bg-white text-black hover:bg-gray-100 hover:text-black"
                >
                  <a
                    href={routeDeeplink(o.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="mr-1 h-4 w-4" />
                    Trasa
                  </a>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled
                  className={cn('border-gray-300 bg-white text-black')}
                  title="Brak adresu w zleceniu"
                >
                  <Navigation className="mr-1 h-4 w-4" />
                  Trasa
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
