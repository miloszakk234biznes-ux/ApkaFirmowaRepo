/**
 * Plik: app/(dashboard)/finances/page.tsx
 * Cel: Moduł finansowy (tylko ADMIN) — dashboard z KPI, wykresami, wydatkami,
 *      przychodami i celami. Pracownik przekierowany na pulpit.
 * Zależności: lib/auth, components/finances/finance-dashboard.
 */
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { auth } from '@/lib/auth';
import { FinanceDashboard } from '@/components/finances/finance-dashboard';

export default async function FinancesPage() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finanse</h1>
        <p className="text-muted-foreground">
          Przychody, koszty, rentowność i cele finansowe firmy.
        </p>
      </div>
      <FinanceDashboard />
    </div>
  );
}
