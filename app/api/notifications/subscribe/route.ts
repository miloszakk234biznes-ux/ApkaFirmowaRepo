/**
 * Plik: app/api/notifications/subscribe/route.ts
 * Cel: Web Push — udostępnia klucz publiczny VAPID (GET) oraz zapisuje subskrypcję
 *      przeglądarki użytkownika (POST). Wyrejestrowanie (DELETE).
 * Zależności: lib/prisma, lib/rbac, lib/push.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { getVapidPublicKey, isPushConfigured } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth();
    return NextResponse.json({
      configured: isPushConfigured(),
      publicKey: getVapidPublicKey(),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const parsed = subSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Błędna subskrypcja' },
        { status: 400 },
      );
    }
    const { endpoint, keys } = parsed.data;
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth },
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAuth();
    const endpoint = new URL(req.url).searchParams.get('endpoint');
    if (endpoint) {
      await prisma.pushSubscription
        .deleteMany({ where: { endpoint } })
        .catch(() => {});
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
