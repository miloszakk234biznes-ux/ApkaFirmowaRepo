/**
 * Plik: components/orders/order-edit-button.tsx
 * Cel: Przycisk „Edytuj" na stronie szczegółów — pobiera pełne zlecenie i otwiera
 *      modal edycji. Po zapisie odświeża stronę (router.refresh).
 * Zależności: components/orders/order-form-dialog, lib/fetcher, next/navigation.
 */
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { Role } from '@prisma/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { OrderFormDialog } from '@/components/orders/order-form-dialog';
import { fetcher } from '@/lib/fetcher';
import type { OrderDetail } from '@/types';

export function OrderEditButton({
  orderId,
  role,
}: {
  orderId: string;
  role: Role;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [order, setOrder] = React.useState<OrderDetail | null>(null);

  async function load() {
    try {
      const res = await fetcher<{ order: OrderDetail }>(
        `/api/orders/${orderId}`,
      );
      setOrder(res.order);
      setOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Nie udało się pobrać');
    }
  }

  return (
    <>
      <Button variant="outline" onClick={load}>
        <Pencil className="h-4 w-4" /> Edytuj
      </Button>
      <OrderFormDialog
        open={open}
        onOpenChange={setOpen}
        role={role}
        order={order}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
