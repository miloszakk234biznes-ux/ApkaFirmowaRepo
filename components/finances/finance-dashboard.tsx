/**
 * Plik: components/finances/finance-dashboard.tsx
 * Cel: Dashboard finansowy (ADMIN) — zakładki Przegląd / Wydatki / Przychody /
 *      Cele. Przegląd: alerty, KPI dziś i miesiąc, widget celu „ile brakuje",
 *      statystyki i wykresy. Tabele odświeżają podsumowanie po zmianach.
 * Zależności: hooks/use-finance, components/finances/*, components/ui/*.
 * Użycie: app/(dashboard)/finances/page.tsx.
 */
'use client';

import { AlertTriangle, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { useFinanceSummary } from '@/hooks/use-finance';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { ExpensesTab } from '@/components/finances/expenses-tab';
import { IncomesTab } from '@/components/finances/incomes-tab';
import { GoalsTab } from '@/components/finances/goals-tab';
import type { FinanceTotals } from '@/types';

// Wykresy (Recharts) ładowane leniwie — zmniejsza initial bundle dashboardu.
const FinanceCharts = dynamic(
  () =>
    import('@/components/finances/finance-charts').then((m) => m.FinanceCharts),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 w-full rounded-lg" />,
  },
);

function KpiGroup({ title, t }: { title: string; t: FinanceTotals }) {
  const cards = [
    { label: 'Przychód', value: formatCurrency(t.revenue) },
    { label: 'Wydatki', value: formatCurrency(t.expense) },
    {
      label: 'Zysk',
      value: formatCurrency(t.profit),
      className: t.profit >= 0 ? 'text-status-done' : 'text-destructive',
    },
    { label: 'Zlecenia', value: String(t.orders) },
  ];
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-xl font-bold ${c.className ?? ''}`}>
                {c.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function FinanceDashboard() {
  const { summary, isLoading, mutate } = useFinanceSummary();

  if (isLoading || !summary) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  const { today, month, stats, goal, alerts } = summary;

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="flex-wrap">
        <TabsTrigger value="overview">Przegląd</TabsTrigger>
        <TabsTrigger value="expenses">Wydatki</TabsTrigger>
        <TabsTrigger value="incomes">Przychody</TabsTrigger>
        <TabsTrigger value="goals">Cele</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Alerty */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                  a.level === 'danger'
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                }`}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        )}

        <KpiGroup title="Dziś" t={today} />
        <KpiGroup title="Ten miesiąc" t={month} />

        {/* Widget celu */}
        {goal && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5" /> Cel miesiąca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(goal.currentRevenue)} z{' '}
                  {formatCurrency(goal.targetRevenue)}
                </span>
                <span className="text-sm font-semibold">
                  {goal.revenuePct.toFixed(0)}%
                </span>
              </div>
              <Progress
                value={goal.revenuePct}
                indicatorClassName={
                  goal.revenuePct >= 100 ? 'bg-status-done' : undefined
                }
              />
              {goal.remainingRevenue > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Do celu brakuje{' '}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(goal.remainingRevenue)}
                  </span>
                  {goal.ordersNeeded
                    ? ` — ok. ${goal.ordersNeeded} zleceń przy średniej ${formatCurrency(goal.avgOrderValue)}.`
                    : '.'}
                </p>
              ) : (
                <p className="text-sm font-medium text-status-done">
                  🎉 Cel przychodu osiągnięty!
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Statystyki */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Średni przychód / zlecenie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">
                {formatCurrency(stats.avgRevenuePerOrder)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Średni koszt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">
                {formatCurrency(stats.avgCost)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Marża (miesiąc)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{stats.marginPct.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Trend M/M
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.revenueTrendPct === null ? (
                <p className="text-xl font-bold">—</p>
              ) : (
                <p
                  className={`flex items-center gap-1 text-xl font-bold ${
                    stats.revenueTrendPct >= 0
                      ? 'text-status-done'
                      : 'text-destructive'
                  }`}
                >
                  {stats.revenueTrendPct >= 0 ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                  {stats.revenueTrendPct.toFixed(1)}%
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <FinanceCharts summary={summary} />
      </TabsContent>

      <TabsContent value="expenses">
        <ExpensesTab onChanged={() => mutate()} />
      </TabsContent>
      <TabsContent value="incomes">
        <IncomesTab onChanged={() => mutate()} />
      </TabsContent>
      <TabsContent value="goals">
        <GoalsTab onChanged={() => mutate()} />
      </TabsContent>
    </Tabs>
  );
}
