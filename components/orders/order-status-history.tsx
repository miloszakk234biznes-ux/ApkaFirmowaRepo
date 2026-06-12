/**
 * Plik: components/orders/order-status-history.tsx
 * Cel: Oś czasu zmian statusu zlecenia (kto, kiedy, z jakiego na jaki status).
 * Zależności: components/orders/order-status-badge, lib/utils, types.
 * Użycie: strona szczegółów zlecenia.
 */
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import type { StatusHistoryItem } from '@/types';

export function OrderStatusHistory({
  history,
}: {
  history: StatusHistoryItem[];
}) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Brak historii zmian.</p>
    );
  }

  return (
    <ol className="space-y-3">
      {history.map((h) => (
        <li key={h.id} className="flex items-start gap-3 text-sm">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {h.fromStatus && (
                <>
                  <OrderStatusBadge status={h.fromStatus} />
                  <span className="text-muted-foreground">→</span>
                </>
              )}
              <OrderStatusBadge status={h.toStatus} />
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(h.createdAt).toLocaleString('pl-PL')}
              {h.changedBy ? ` · ${h.changedBy.name ?? h.changedBy.email}` : ''}
              {h.note ? ` · ${h.note}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
