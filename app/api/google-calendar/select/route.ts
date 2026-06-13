/**
 * Plik: app/api/google-calendar/select/route.ts
 * Cel: Zapisuje wybrany kalendarz docelowy Google dla użytkownika.
 * Zależności: lib/prisma, lib/rbac, zod.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';

const schema = z.object({ calendarId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Błędne dane' }, { status: 400 });
    }

    const conn = await prisma.googleCalendarConnection.findUnique({
      where: { userId: session.user.id },
    });
    if (!conn) {
      return NextResponse.json(
        { error: 'Brak połączenia z Google' },
        { status: 400 },
      );
    }

    await prisma.googleCalendarConnection.update({
      where: { userId: session.user.id },
      data: { calendarId: parsed.data.calendarId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
