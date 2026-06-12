/**
 * Plik: app/(dashboard)/dashboard/page.tsx
 * Cel: Widok główny (pulpit). W Etapie 1 prezentuje powitanie i puste karty KPI
 *      (wypełniane danymi w Etapie 5). Server Component — pobiera sesję.
 * Zależności: lib/auth, components/ui/card.
 */
import { auth } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  const session = await auth();
  const name = session?.user?.name ?? 'użytkowniku';

  const kpis = [
    { label: 'Dzisiejsze zlecenia', value: '0' },
    { label: 'Przychód dziś', value: formatCurrency(0) },
    { label: 'Wydatki dziś', value: formatCurrency(0) },
    { label: 'Zysk dziś', value: formatCurrency(0) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Witaj, {name.split(' ')[0]} 👋
        </h1>
        <p className="text-muted-foreground">
          Oto przegląd Twojej firmy na dziś.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Najbliższe zlecenia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Brak zaplanowanych zleceń. Moduł kalendarza i zleceń uruchamiamy w
            Etapie 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
