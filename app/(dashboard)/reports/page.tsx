/**
 * Plik: app/(dashboard)/reports/page.tsx
 * Cel: Raporty i dokumenty (ADMIN) — wystawianie faktur, centrum dokumentów,
 *      eksport rocznego raportu finansowego (PDF/XLSX) oraz dane firmy.
 * Zależności: lib/auth, components/documents/*.
 */
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { auth } from '@/lib/auth';
import { ReportsTabs } from '@/components/documents/reports-tabs';

export default async function ReportsPage() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Raporty i dokumenty</h1>
        <p className="text-muted-foreground">
          Faktury, eksport raportów finansowych i dane firmy.
        </p>
      </div>
      <ReportsTabs />
    </div>
  );
}
