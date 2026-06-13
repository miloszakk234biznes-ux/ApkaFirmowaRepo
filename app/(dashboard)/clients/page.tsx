/**
 * Plik: app/(dashboard)/clients/page.tsx
 * Cel: Strona listy klientów (CRM) — fulltext search, sort, paginacja, export.
 * Zależności: components/clients/clients-table.
 */
import { ClientsTable } from '@/components/clients/clients-table';

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Klienci</h1>
        <p className="text-muted-foreground">
          Baza klientów z historią zleceń, płatności i wyszukiwaniem.
        </p>
      </div>
      <ClientsTable />
    </div>
  );
}
