/**
 * Plik: components/orders/order-status-badge.tsx
 * Cel: Wizualny znacznik statusu zlecenia z kolorem z lib/constants.
 * Zależności: components/ui/badge, lib/constants.
 * Użycie: tabela zleceń, panel dnia, szczegóły zlecenia.
 */
import { OrderStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { ORDER_STATUS } from '@/lib/constants';

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const meta = ORDER_STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.badge,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}
