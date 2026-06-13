/**
 * Plik: app/api/notifications/route.ts
 * Cel: Centrum powiadomień — lista powiadomień użytkownika + licznik
 *      nieprzeczytanych (GET). Oznaczanie wszystkich jako przeczytane (POST).
 * Zależności: lib/prisma, lib/rbac.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
    ]);
    return NextResponse.json({ items, unread });
  } catch (error) {
    return handleAuthError(error);
  }
}

// Oznacz wszystkie jako przeczytane.
export async function POST() {
  try {
    const session = await requireAuth();
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
