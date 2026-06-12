/**
 * Plik: app/api/google-calendar/calendars/route.ts
 * Cel: Lista kalendarzy Google użytkownika (do wyboru kalendarza docelowego).
 * Zależności: lib/rbac, lib/google-calendar.
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { listCalendars } from '@/lib/google-calendar';

export async function GET() {
  try {
    const session = await requireAuth();
    const calendars = await listCalendars(session.user.id);
    return NextResponse.json({ calendars });
  } catch (error) {
    if (error instanceof Error && error.message.includes('połączenia')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
