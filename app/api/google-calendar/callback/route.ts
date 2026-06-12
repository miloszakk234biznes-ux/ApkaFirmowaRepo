/**
 * Plik: app/api/google-calendar/callback/route.ts
 * Cel: Odbiera kod autoryzacyjny od Google, weryfikuje state (CSRF), wymienia kod
 *      na tokeny i zapisuje połączenie. Przekierowuje do ustawień z komunikatem.
 * Zależności: lib/rbac, lib/google-calendar, lib/audit.
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { exchangeCodeAndStore, getBaseUrl } from '@/lib/google-calendar';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const settingsUrl = `${getBaseUrl()}/settings`;

    if (error) {
      return NextResponse.redirect(`${settingsUrl}?google=denied`);
    }

    // Weryfikacja state z cookie (CSRF).
    const cookieState = req.headers
      .get('cookie')
      ?.match(/gcal_oauth_state=([a-f0-9]+)/)?.[1];
    if (!code || !state || !cookieState || state !== cookieState) {
      return NextResponse.redirect(`${settingsUrl}?google=error`);
    }

    await exchangeCodeAndStore(session.user.id, code);
    await createAuditLog({
      userId: session.user.id,
      action: 'GOOGLE_CALENDAR_CONNECT',
      entity: 'User',
      entityId: session.user.id,
    });

    const res = NextResponse.redirect(`${settingsUrl}?google=connected`);
    res.cookies.delete('gcal_oauth_state');
    return res;
  } catch (error) {
    return handleAuthError(error);
  }
}
