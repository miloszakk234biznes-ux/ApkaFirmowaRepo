/**
 * Plik: app/(dashboard)/todo/page.tsx
 * Cel: Moduł To-Do (placeholder w Etapie 1).
 * Zależności: components/shared/page-placeholder.
 */
import { PagePlaceholder } from '@/components/shared/page-placeholder';

export default function TodoPage() {
  return (
    <PagePlaceholder
      title="To-Do"
      description="Zadania prywatne i firmowe, checklisty, terminy i priorytety."
      stage="Etapie 6"
    />
  );
}
