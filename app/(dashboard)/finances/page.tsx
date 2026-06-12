/**
 * Plik: app/(dashboard)/finances/page.tsx
 * Cel: Moduł finansowy — dostępny tylko dla administratora (placeholder Etap 1).
 *      Pracownik zostaje przekierowany na pulpit (RBAC warstwowy).
 * Zależności: lib/auth, components/shared/page-placeholder.
 */
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { auth } from '@/lib/auth';
import { PagePlaceholder } from '@/components/shared/page-placeholder';

export default async function FinancesPage() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) {
    redirect('/dashboard');
  }

  return (
    <PagePlaceholder
      title="Finanse"
      description="Przychody, koszty, rentowność zleceń i cele finansowe."
      stage="Etapie 5"
    />
  );
}
