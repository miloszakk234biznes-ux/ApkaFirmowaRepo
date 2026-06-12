/**
 * Plik: app/(dashboard)/settings/page.tsx
 * Cel: Ustawienia konta — podgląd danych zalogowanego użytkownika oraz wylogowanie.
 *      Pełna konfiguracja (Google, powiadomienia, dane firmy) dochodzi w kolejnych
 *      etapach.
 * Zależności: lib/auth, components/ui/card.
 */
import { auth } from '@/lib/auth';
import { Role } from '@prisma/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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

      {user?.role === Role.ADMIN && (
        <Card>
          <CardHeader>
            <CardTitle>Zarządzanie pracownikami</CardTitle>
            <CardDescription>
              Tworzenie kont, blokowanie i zmiana ról — w przygotowaniu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Panel administracyjny pracowników zostanie rozbudowany w kolejnych
              etapach (RBAC jest już aktywny).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
