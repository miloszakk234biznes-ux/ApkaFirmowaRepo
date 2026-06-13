/**
 * Plik: app/(dashboard)/settings/page.tsx
 * Cel: Ustawienia konta — podgląd danych zalogowanego użytkownika oraz wylogowanie.
 *      Pełna konfiguracja (Google, powiadomienia, dane firmy) dochodzi w kolejnych
 *      etapach.
 * Zależności: lib/auth, components/ui/card.
 */
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { Role } from '@prisma/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GoogleCalendarCard } from '@/components/settings/google-calendar-card';
import { PushCard } from '@/components/settings/push-card';
import { UsersCard } from '@/components/settings/users-card';

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ustawienia</h1>
        <p className="text-muted-foreground">
          Zarządzaj swoim kontem i preferencjami aplikacji.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Twoje konto</CardTitle>
          <CardDescription>Dane zalogowanego użytkownika.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Imię i nazwisko</span>
            <span className="font-medium">{user?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">E-mail</span>
            <span className="font-medium">{user?.email ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rola</span>
            <span className="font-medium">
              {user?.role === Role.ADMIN ? 'Administrator' : 'Pracownik'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <GoogleCalendarCard />
      </Suspense>

      <PushCard />

      {user?.role === Role.ADMIN && user.id && (
        <UsersCard currentUserId={user.id} />
      )}
    </div>
  );
}
