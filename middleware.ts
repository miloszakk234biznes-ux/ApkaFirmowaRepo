/**
 * Plik: middleware.ts
 * Cel: Ochrona tras aplikacji (RBAC na poziomie routingu). Niezalogowani
 *      użytkownicy są przekierowywani do /login z parametrem callbackUrl.
 *      Trasy `(dashboard)` wymagają sesji; sekcja `/settings/admin` oraz
 *      `/finances` (dla pełnego widoku) bazują na roli sprawdzanej dodatkowo
 *      w warstwie API. Tu pilnujemy podstawowego dostępu.
 * Zależności: next-auth/middleware.
 *
 * Uwaga: middleware używa tokenu JWT (edge-safe). Szczegółowe RBAC dla danych
 * realizują handlery API przez lib/rbac.ts.
 */
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Sekcje przeznaczone wyłącznie dla administratora.
    const adminOnlyPrefixes = ['/settings/users'];
    const isAdminRoute = adminOnlyPrefixes.some((p) => pathname.startsWith(p));

    if (isAdminRoute && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Dostęp tylko z ważnym tokenem; brak tokenu → przekierowanie do signIn.
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  },
);

// Chronimy wszystkie trasy poza publicznymi (auth, api/auth, zasoby statyczne).
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/calendar/:path*',
    '/orders/:path*',
    '/clients/:path*',
    '/finances/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/todo/:path*',
  ],
};
