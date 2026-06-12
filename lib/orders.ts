/**
 * Plik: lib/orders.ts
 * Cel: Logika domenowa zleceń współdzielona przez trasy API: wyliczanie kwot,
 *      ograniczanie widoczności wg roli (RBAC scope) oraz zapis historii statusu.
 * Zależności: lib/prisma, @prisma/client, next-auth (Session).
 */
import { Prisma, OrderStatus, Role } from '@prisma/client';
import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';

/** Pełny zestaw pól dołączanych przy zwracaniu zlecenia (lista/detal). */
export const orderInclude = {
  client: {
    select: { id: true, firstName: true, lastName: true, phone: true },
  },
  assignedUser: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrderInclude;

/**
 * Zwraca warunek `where` ograniczający zlecenia do widocznych dla użytkownika.
 * Admin widzi wszystko; pracownik tylko przypisane do siebie.
 */
export function scopeForUser(session: Session): Prisma.OrderWhereInput {
  if (session.user.role === Role.ADMIN) return {};
  return { assignedUserId: session.user.id };
}

/** Czy użytkownik może modyfikować dane zlecenie. */
export function canMutateOrder(
  session: Session,
  order: { assignedUserId: string | null },
): boolean {
  if (session.user.role === Role.ADMIN) return true;
  return order.assignedUserId === session.user.id;
}

/** remainingAmount = max(0, amount - deposit), zaokrąglone do groszy. */
export function computeRemaining(amount: number, deposit: number): number {
  return Math.max(0, Math.round((amount - deposit) * 100) / 100);
}

/**
 * Zapisuje wpis historii statusu, jeśli status faktycznie się zmienił.
 * Wywoływane wewnątrz transakcji lub po update.
 */
export async function recordStatusChange(params: {
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedById: string;
  note?: string;
  tx?: Prisma.TransactionClient;
}): Promise<void> {
  if (params.fromStatus === params.toStatus) return;
  const client = params.tx ?? prisma;
  await client.orderStatusHistory.create({
    data: {
      orderId: params.orderId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      changedById: params.changedById,
      note: params.note,
    },
  });
}
