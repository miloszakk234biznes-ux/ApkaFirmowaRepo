/**
 * Plik: app/(dashboard)/orders/page.tsx
 * Cel: Lista i zarządzanie zleceniami (placeholder w Etapie 1).
 * Zależności: components/shared/page-placeholder.
 */
import { PagePlaceholder } from '@/components/shared/page-placeholder';

export default function OrdersPage() {
  return (
    <PagePlaceholder
      title="Zlecenia"
      description="Pełny cykl życia zlecenia: tworzenie, edycja, statusy."
      stage="Etapie 2"
    />
  );
}
