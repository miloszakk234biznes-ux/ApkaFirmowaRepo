/**
 * Plik: app/api/orders/[id]/status/route.ts
 * Cel: Lekki endpoint zmiany statusu zlecenia z opcjonalną notatką (używany
 *      przez szybkie akcje statusu i panel dnia). Zapis historii + audyt.
 * Zależności: lib/prisma, lib/rbac, lib/orders, lib/validations/order.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { canMutateOrder, orderInclude, recordStatusChange } from '@/lib/orders';
import { changeStatusSchema } from '@/lib/validations/order';
import { createAuditLog } from '@/lib/audit';
import { syncOrderToGoogle } from '@/lib/google-calendar';
import { syncOrderIncome } from '@/lib/finance';

type Params = { params: { id: string } };

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
    const parsed = changeStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowy status', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
      include: orderInclude,
    });

    await recordStatusChange({
      orderId: order.id,
      fromStatus: existing.status,
      toStatus: parsed.data.status,
      changedById: session.user.id,
      note: parsed.data.note,
    });
    await createAuditLog({
      userId: session.user.id,
      action: 'ORDER_STATUS_CHANGE',
      entity: 'Order',
      entityId: order.id,
      details: `${existing.status} -> ${parsed.data.status}`,
    });

    // Auto-przychód: tworzy/usuwa wpis Income przy DONE.
    await syncOrderIncome(order);
    // Odzwierciedl zmianę statusu w Google Calendar (np. anulowanie usuwa event).
    await syncOrderToGoogle(order, session.user.id);

    return NextResponse.json({ order });
  } catch (error) {
    return handleAuthError(error);
  }
}
