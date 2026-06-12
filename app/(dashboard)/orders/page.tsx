/**
 * Plik: app/(dashboard)/orders/page.tsx
 * Cel: Strona listy zleceń — tabela z wyszukiwaniem, filtrami, sortem, paginacją.
 * Zależności: lib/auth, components/orders/orders-table.
 */
import { auth } from '@/lib/auth';
import { Role } from '@prisma/client';
import { OrdersTable } from '@/components/orders/orders-table';

export default async function OrdersPage() {
  const session = await auth();
  const role = session?.user?.role ?? Role.EMPLOYEE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Zlecenia</h1>
        <p className="text-muted-foreground">
          Zarządzaj zleceniami: dodawaj, edytuj, zmieniaj statusy.
        </p>
      </div>
      <OrdersTable role={role} />
    </div>
  );
}
