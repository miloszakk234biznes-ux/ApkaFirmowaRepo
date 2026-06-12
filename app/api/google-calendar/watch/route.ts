/**
 * Plik: app/api/google-calendar/watch/route.ts
 * Cel: Włącza (POST) lub wyłącza (DELETE) powiadomienia push Google Calendar
 *      dla użytkownika. Wymaga publicznego HTTPS (adres webhooka).
 * Zależności: lib/rbac, lib/google-calendar.
 */
import { NextResponse } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import {
  startWatch,
  stopWatch,
  isGoogleConfigured,
} from '@/lib/google-calendar';

export async function POST() {
  try {
    const session = await requireAuth();
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { error: 'Integracja Google nie jest skonfigurowana' },
        { status: 503 },
      );
    }
    await startWatch(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('połączenia')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}

export async function DELETE() {
  try {
    const session = await requireAuth();
    await stopWatch(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
