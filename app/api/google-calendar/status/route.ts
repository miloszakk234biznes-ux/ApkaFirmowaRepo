/**
 * Plik: app/api/google-calendar/status/route.ts
 * Cel: Zwraca stan integracji Google Calendar dla zalogowanego użytkownika
 *      (czy skonfigurowana, czy połączona, e-mail, wybrany kalendarz, push).
 * Zależności: lib/prisma, lib/rbac, lib/google-calendar.
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { isGoogleConfigured } from '@/lib/google-calendar';

export async function GET() {
  try {
    const session = await requireAuth();
    const conn = await prisma.googleCalendarConnection.findUnique({
      where: { userId: session.user.id },
      select: {
        googleEmail: true,
        calendarId: true,
        channelId: true,
        channelExpiration: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      configured: isGoogleConfigured(),
      connected: Boolean(conn),
      email: conn?.googleEmail ?? null,
      calendarId: conn?.calendarId ?? null,
      pushEnabled: Boolean(conn?.channelId),
      pushExpiration: conn?.channelExpiration ?? null,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
