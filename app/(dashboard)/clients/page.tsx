/**
 * Plik: app/(dashboard)/clients/page.tsx
 * Cel: CRM klientów (placeholder w Etapie 1).
 * Zależności: components/shared/page-placeholder.
 */
import { PagePlaceholder } from '@/components/shared/page-placeholder';

export default function ClientsPage() {
  return (
    <PagePlaceholder
      title="Klienci"
      description="Baza klientów z historią zleceń i wyszukiwaniem."
      stage="Etapie 4"
    />
  );
}
