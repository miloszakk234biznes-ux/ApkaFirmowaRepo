/**
 * Plik: components/orders/order-form-page.tsx
 * Cel: Klientowy wrapper OrderForm dla dedykowanej strony tworzenia zlecenia —
 *      po sukcesie przechodzi do szczegółów utworzonego zlecenia.
 * Zależności: components/orders/order-form, next/navigation.
 */
'use client';

import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';
import { OrderForm } from '@/components/orders/order-form';

export function OrderFormPage({ role }: { role: Role }) {
  const router = useRouter();
  return (
    <OrderForm
      role={role}
      onCancel={() => router.back()}
      onSuccess={(id) => {
        router.push(`/orders/${id}`);
        router.refresh();
      }}
    />
  );
}
