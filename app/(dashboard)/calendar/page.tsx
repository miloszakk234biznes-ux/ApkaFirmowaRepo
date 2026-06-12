/**
 * Plik: app/(dashboard)/calendar/page.tsx
 * Cel: Strona kalendarza zleceń (widoki miesiąc/tydzień/dzień, filtry, dnd).
 * Zależności: lib/auth, components/calendar/calendar-shell.
 */
import { auth } from '@/lib/auth';
import { Role } from '@prisma/client';
import { CalendarShell } from '@/components/calendar/calendar-shell';

export default async function CalendarPage() {
  const session = await auth();
  const role = session?.user?.role ?? Role.EMPLOYEE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kalendarz</h1>
        <p className="text-muted-foreground">
          Przeglądaj i planuj zlecenia. Przeciągnij zlecenie, aby zmienić
          termin.
        </p>
      </div>
      <CalendarShell role={role} />
    </div>
  );
}
