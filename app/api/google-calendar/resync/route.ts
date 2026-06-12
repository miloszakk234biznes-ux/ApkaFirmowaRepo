/**
 * Plik: app/api/google-calendar/resync/route.ts
 * Cel: Ręczna (ponowna) synchronizacja zlecenia z Google Calendar. Body: { orderId }.
 *      RBAC jak dla edycji zlecenia. Zwraca zaktualizowany status synchronizacji.
 * Zależności: lib/prisma, lib/rbac, lib/orders, lib/google-calendar, zod.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { canMutateOrder } from '@/lib/orders';
import { syncOrderToGoogle, isGoogleConfigured } from '@/lib/google-calendar';

const schema = z.object({ orderId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { error: 'Integracja Google nie jest skonfigurowana' },
        { status: 503 },
      );
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Błędne dane' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
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

    await syncOrderToGoogle(order, session.user.id);

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      select: {
        googleSyncStatus: true,
        googleSyncError: true,
        googleSyncedAt: true,
        googleCalendarEventId: true,
      },
    });
    return NextResponse.json({ sync: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}
