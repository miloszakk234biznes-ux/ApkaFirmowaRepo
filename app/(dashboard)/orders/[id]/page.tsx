/**
 * Plik: app/(dashboard)/orders/[id]/page.tsx
 * Cel: Szczegóły zlecenia — dane, klient, kwoty, szybka zmiana statusu, edycja
 *      oraz historia zmian statusu. RBAC: pracownik widzi tylko swoje zlecenia.
 * Zależności: lib/auth, lib/prisma, lib/orders, components/orders/*.
 */
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, User, Clock } from 'lucide-react';
import { Role } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canMutateOrder } from '@/lib/orders';
import { formatCurrency } from '@/lib/utils';
import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  PRIORITY,
  SERVICE_TYPES,
} from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { OrderStatusActions } from '@/components/orders/order-status-actions';
import { OrderEditButton } from '@/components/orders/order-edit-button';
import { OrderStatusHistory } from '@/components/orders/order-status-history';
import { OrderAttachments } from '@/components/orders/order-attachments';
import type { StatusHistoryItem } from '@/types';

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      assignedUser: { select: { id: true, name: true, email: true } },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: { changedBy: { select: { name: true, email: true } } },
      },
    },
  });

  if (!order) notFound();
  if (!canMutateOrder(session, order)) redirect('/orders');

  const history: StatusHistoryItem[] = order.statusHistory.map((h) => ({
    id: h.id,
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    note: h.note,
    createdAt: h.createdAt.toISOString(),
    changedBy: h.changedBy,
  }));

  const serviceLabel =
    order.serviceType && SERVICE_TYPES.includes(order.serviceType)
      ? order.serviceType
      : order.serviceType;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" /> Zlecenia
          </Link>
        </Button>
        <OrderEditButton orderId={order.id} role={session.user.role} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{order.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <span className={PRIORITY[order.priority].className}>
              Priorytet: {PRIORITY[order.priority].label}
            </span>
          </div>
        </div>
        <OrderStatusActions orderId={order.id} current={order.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Szczegóły</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {serviceLabel && (
              <p className="text-muted-foreground">Usługa: {serviceLabel}</p>
            )}
            {order.scheduledAt && (
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {order.scheduledAt.toLocaleString('pl-PL')}
                {order.estimatedDuration
                  ? ` · ${order.estimatedDuration} min`
                  : ''}
              </p>
            )}
            {order.address && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {order.address}
              </p>
            )}
            {order.assignedUser && (
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {order.assignedUser.name ?? order.assignedUser.email}
              </p>
            )}
            {order.description && (
              <p className="whitespace-pre-wrap pt-2">{order.description}</p>
            )}
            {order.notes && (
              <p className="rounded-md bg-muted p-2 text-muted-foreground">
                {order.notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Klient i płatność</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.client ? (
              <>
                <p className="font-medium">
                  {order.client.firstName} {order.client.lastName}
                </p>
                {order.client.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${order.client.phone}`}
                      className="hover:underline"
                    >
                      {order.client.phone}
                    </a>
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Brak przypisanego klienta</p>
            )}
            <div className="mt-2 space-y-1 border-t pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kwota brutto</span>
                <span className="font-medium">
                  {formatCurrency(order.amount.toString())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zaliczka</span>
                <span>{formatCurrency(order.deposit.toString())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pozostało</span>
                <span className="font-semibold">
                  {formatCurrency(order.remainingAmount.toString())}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Płatność</span>
                <span>
                  {PAYMENT_STATUS[order.paymentStatus]}
                  {order.paymentMethod
                    ? ` · ${PAYMENT_METHOD[order.paymentMethod]}`
                    : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Załączniki</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderAttachments orderId={order.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historia statusu</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderStatusHistory history={history} />
        </CardContent>
      </Card>
    </div>
  );
}
