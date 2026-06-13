/**
 * Plik: components/shared/page-placeholder.tsx
 * Cel: Spójny placeholder dla modułów wdrażanych w kolejnych etapach.
 *      Prezentuje tytuł, opis i informację o etapie, w którym moduł powstanie.
 * Zależności: components/ui/card.
 * Użycie: strony (dashboard)/* w Etapie 1 (przed implementacją modułu).
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface PagePlaceholderProps {
  title: string;
  description: string;
  stage: string;
}

export function PagePlaceholder({
  title,
  description,
  stage,
}: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Moduł w przygotowaniu</CardTitle>
          <CardDescription>
            Pełna funkcjonalność tego modułu zostanie dodana w{' '}
            <span className="font-medium text-foreground">{stage}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Etap 1 dostarcza działający szkielet aplikacji: autoryzację,
            nawigację, motywy oraz strukturę bazy danych.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
