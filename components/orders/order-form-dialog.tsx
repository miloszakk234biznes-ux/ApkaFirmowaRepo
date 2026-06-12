/**
 * Plik: components/orders/order-form-dialog.tsx
 * Cel: Modal opakowujący OrderForm — tworzenie/edycja zlecenia bez opuszczania
 *      widoku (kalendarz, lista). Po sukcesie woła onSaved (do odświeżenia danych).
 * Zależności: components/ui/dialog, components/orders/order-form.
 */
'use client';

import * as React from 'react';
import { Role } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OrderForm } from '@/components/orders/order-form';
import type { OrderDetail } from '@/types';

interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  order?: OrderDetail | null;
  defaultScheduledAt?: string;
  onSaved?: (orderId: string) => void;
}

export function OrderFormDialog({
  open,
  onOpenChange,
  role,
  order,
  defaultScheduledAt,
  onSaved,
}: OrderFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {order ? 'Edytuj zlecenie' : 'Nowe zlecenie'}
          </DialogTitle>
          <DialogDescription>
            Wypełnij dane zlecenia. Pola oznaczone * są wymagane.
          </DialogDescription>
        </DialogHeader>
        <OrderForm
          role={role}
          order={order}
          defaultScheduledAt={defaultScheduledAt}
          onCancel={() => onOpenChange(false)}
          onSuccess={(id) => {
            onOpenChange(false);
            onSaved?.(id);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
