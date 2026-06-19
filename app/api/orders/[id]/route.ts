/**
 * Plik: app/api/orders/[id]/route.ts
 * Cel: Operacje na pojedynczym zleceniu: pobranie (GET), aktualizacja (PATCH —
 *      pełna edycja + zmiana statusu z historią), usunięcie (DELETE). RBAC scope.
 * Zależności: lib/prisma, lib/rbac, lib/orders, lib/validations/order, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import {
  canMutateOrder,
  orderInclude,
  computeRemaining,
  recordStatusChange,
} from '@/lib/orders';
import { updateOrderSchema } from '@/lib/validations/order';
import { createAuditLog } from '@/lib/audit';
import { syncOrderToGoogle, deleteOrderEvent } from '@/lib/google-calendar';
import { syncOrderIncome } from '@/lib/finance';

type Params = { params: { id: string } };

// GET /api/orders/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        ...orderInclude,
        client: true,
        costs: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: { changedBy: { select: { name: true, email: true } } },
        },
      },
    });
    if (!order) {
      return NextResponse.json(
        { error: 'Zlecenie nie istnieje' },
        { status: 404 },
      );
    }
    if (!canMutateOrder(session, order)) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    return handleAuthError(error);
  }
}

// PATCH /api/orders/:id
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const existing = await prisma.order.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Zlecenie nie istnieje' },
        { status: 404 },
      );
    }
    if (!canMutateOrder(session, existing)) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;

    // Wylicz kwoty na bazie nowych lub dotychczasowych wartości.
    const nextAmount = d.amount ?? Number(existing.amount);
    const nextDeposit = d.deposit ?? Number(existing.deposit);

    const data: Prisma.OrderUpdateInput = {
      title: d.title,
      serviceType: d.serviceType,
      description: d.description,
      address: d.address,
      estimatedDuration: d.estimatedDuration,
      priority: d.priority,
      paymentMethod: d.paymentMethod,
      paymentStatus: d.paymentStatus,
      isRecurring: d.isRecurring,
      recurringRule: d.recurringRule,
      notes: d.notes,
      status: d.status,
    };
    if (d.scheduledAt !== undefined) {
      data.scheduledAt = d.scheduledAt ? new Date(d.scheduledAt) : null;
    }
    if (d.amount !== undefined || d.deposit !== undefined) {
      data.amount = new Prisma.Decimal(nextAmount);
      data.deposit = new Prisma.Decimal(nextDeposit);
      data.remainingAmount = new Prisma.Decimal(
        computeRemaining(nextAmount, nextDeposit),
      );
    }
    if (d.clientId !== undefined) {
      data.client = d.clientId
        ? { connect: { id: d.clientId } }
        : { disconnect: true };
    }
    // Tylko admin może zmienić przypisanego pracownika.
    if (d.assignedUserId !== undefined && session.user.role === Role.ADMIN) {
      data.assignedUser = d.assignedUserId
        ? { connect: { id: d.assignedUserId } }
        : { disconnect: true };
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data,
      include: orderInclude,
    });

    if (d.status && d.status !== existing.status) {
      await recordStatusChange({
        orderId: order.id,
        fromStatus: existing.status,
        toStatus: d.status,
        changedById: session.user.id,
      });
    }
    await createAuditLog({
      userId: session.user.id,
      action: 'ORDER_UPDATE',
      entity: 'Order',
      entityId: order.id,
      details: d.status ? `status=${d.status}` : undefined,
    });

    // Auto-przychód oraz synchronizacja zmian z Google Calendar.
    if (
      d.status !== undefined ||
      d.amount !== undefined ||
      d.paymentStatus !== undefined
    ) {
      await syncOrderIncome(order);
    }
    await syncOrderToGoogle(order, session.user.id);

    return NextResponse.json({ order });
  } catch (error) {
    return handleAuthError(error);
  }
}

// DELETE /api/orders/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const existing = await prisma.order.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Zlecenie nie istnieje' },
        { status: 404 },
      );
    }
    if (!canMutateOrder(session, existing)) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    // Usuń powiązany event Google przed usunięciem zlecenia.
    await deleteOrderEvent(existing, session.user.id);

    await prisma.order.delete({ where: { id: params.id } });
    await createAuditLog({
      userId: session.user.id,
      action: 'ORDER_DELETE',
      entity: 'Order',
      entityId: params.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
