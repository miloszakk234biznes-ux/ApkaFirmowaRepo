/**
 * Plik: app/api/clients/check/route.ts
 * Cel: Detekcja duplikatu klienta po numerze telefonu (przed dodaniem nowego).
 *      Zwraca pasującego klienta lub null.
 * Zależności: lib/prisma, lib/rbac.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requireAuth();
    const phone = new URL(req.url).searchParams.get('phone')?.trim();
    if (!phone) {
      return NextResponse.json({ duplicate: null });
    }
    const duplicate = await prisma.client.findFirst({
      where: { phone },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
    return NextResponse.json({ duplicate });
  } catch (error) {
    return handleAuthError(error);
  }
}
