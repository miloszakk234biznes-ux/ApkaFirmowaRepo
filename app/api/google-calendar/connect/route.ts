/**
 * Plik: app/api/google-calendar/connect/route.ts
 * Cel: Rozpoczyna proces łączenia konta z Google Calendar — generuje URL zgody
 *      OAuth2 i przekierowuje. Token CSRF (state) zapisywany w cookie httpOnly.
 * Zależności: lib/rbac, lib/google-calendar, node:crypto.
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { getAuthUrl, isGoogleConfigured } from '@/lib/google-calendar';

export async function GET() {
  try {
    await requireAuth();
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { error: 'Integracja Google nie jest skonfigurowana' },
        { status: 503 },
      );
    }

    const state = randomBytes(16).toString('hex');
    const url = getAuthUrl(state);

    const res = NextResponse.redirect(url);
    res.cookies.set('gcal_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 min
      path: '/',
    });
    return res;
  } catch (error) {
    return handleAuthError(error);
  }
}
