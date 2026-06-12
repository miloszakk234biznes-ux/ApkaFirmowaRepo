/**
 * Plik: app/(dashboard)/calendar/page.tsx
 * Cel: Strona kalendarza zleceń (placeholder w Etapie 1).
 * Zależności: components/shared/page-placeholder.
 */
import { PagePlaceholder } from '@/components/shared/page-placeholder';

export default function CalendarPage() {
  return (
    <PagePlaceholder
      title="Kalendarz"
      description="Widoki miesiąc / tydzień / dzień z kolorowaniem statusów."
      stage="Etapie 2"
    />
  );
}
