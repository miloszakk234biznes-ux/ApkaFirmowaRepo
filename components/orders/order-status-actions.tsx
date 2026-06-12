/**
 * Plik: components/orders/order-status-actions.tsx
 * Cel: Szybka zmiana statusu zlecenia ze strony szczegółów (select + zapis przez
 *      lekki endpoint /status). Po zmianie odświeża dane (router.refresh).
 * Zależności: components/ui/select, lib/fetcher, lib/constants, next/navigation.
 */
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { OrderStatus } from '@prisma/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/fetcher';
import { ORDER_STATUS_OPTIONS } from '@/lib/constants';

export function OrderStatusActions({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatus;
}) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);

  async function change(status: string) {
    if (status === current) return;
    setSaving(true);
    try {
      await apiRequest(`/api/orders/${orderId}/status`, 'PATCH', { status });
      toast.success('Status zmieniony');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd zmiany statusu');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Select defaultValue={current} onValueChange={change} disabled={saving}>
      <SelectTrigger className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUS_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
