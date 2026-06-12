/**
 * Plik: app/page.tsx
 * Cel: Strona startowa — przekierowuje do dashboardu (zalogowani) lub
 *      do logowania (goście). Logika dostępu egzekwowana przez middleware.
 * Zależności: lib/auth, next/navigation.
 */
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function HomePage() {
  const session = await auth();
  redirect(session?.user ? '/dashboard' : '/login');
}
