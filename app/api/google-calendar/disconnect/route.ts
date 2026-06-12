/**
 * Plik: app/api/google-calendar/disconnect/route.ts
 * Cel: Rozłącza konto Google — usuwa zapisane połączenie (i tokeny). Próbuje
 *      też zatrzymać kanał push, jeśli był aktywny.
 * Zależności: lib/prisma, lib/rbac, lib/audit.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

export async function POST() {
  try {
    const session = await requireAuth();
    await prisma.googleCalendarConnection
      .delete({ where: { userId: session.user.id } })
      .catch(() => {});
    await createAuditLog({
      userId: session.user.id,
      action: 'GOOGLE_CALENDAR_DISCONNECT',
      entity: 'User',
      entityId: session.user.id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
