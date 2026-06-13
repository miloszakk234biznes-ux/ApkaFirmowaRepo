/**
 * Plik: lib/rbac.ts
 * Cel: Pomocniki RBAC dla tras API. `requireAuth` zwraca sesję lub rzuca
 *      odpowiedź 401, `requireRole` dodatkowo weryfikuje rolę (403).
 *      Używane w handlerach `/api/*` w kolejnych etapach.
 * Zależności: next-auth, lib/auth.
 */
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { auth } from '@/lib/auth';
import type { Session } from 'next-auth';

/** Błąd autoryzacji niosący gotową odpowiedź HTTP. */
export class AuthError extends Error {
  constructor(public response: NextResponse) {
    super('AuthError');
  }
}

/**
 * Zwraca aktywną sesję lub rzuca AuthError(401).
 * Użycie w handlerze: `const session = await requireAuth();`
 * w bloku try/catch z `handleAuthError`.
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError(
      NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 }),
    );
  }
  return session;
}

/** Jak `requireAuth`, ale wymaga jednej z podanych ról (inaczej 403). */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    throw new AuthError(
      NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 }),
    );
  }
  return session;
}

/** Tłumaczy AuthError na odpowiedź HTTP; inne błędy rzuca dalej. */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return error.response;
  }
  console.error('[api] Nieobsłużony błąd:', error);
  return NextResponse.json(
    { error: 'Wewnętrzny błąd serwera' },
    { status: 500 },
  );
}

/** Skrót: czy sesja należy do administratora. */
export function isAdmin(session: Session): boolean {
  return session.user.role === Role.ADMIN;
}
