/**
 * Plik: app/(dashboard)/reports/page.tsx
 * Cel: Raporty i faktury — dostępne tylko dla administratora (placeholder Etap 1).
 * Zależności: lib/auth, components/shared/page-placeholder.
 */
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { auth } from '@/lib/auth';
import { PagePlaceholder } from '@/components/shared/page-placeholder';

export default async function ReportsPage() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) {
    redirect('/dashboard');
  }

  return (
    <PagePlaceholder
      title="Raporty"
      description="Faktury PDF oraz eksport raportów finansowych (PDF/XLSX)."
      stage="Etapie 6"
    />
  );
}
