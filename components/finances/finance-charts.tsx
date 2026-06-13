/**
 * Plik: components/finances/finance-charts.tsx
 * Cel: Wykresy finansowe (Recharts) — przychody vs koszty (M/M, bar), zysk netto
 *      (linia), koszty wg kategorii (pie). Komponenty klienta.
 * Zależności: recharts, components/ui/card, lib/utils.
 * Użycie: zakładka „Przegląd" dashboardu finansowego.
 */
'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { FinanceSummary } from '@/types';

const PIE_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
];

// Formatter tooltipa zgodny z typami Recharts (value może być różnego typu).
const currencyTooltip = (value: unknown) => formatCurrency(Number(value));

export function FinanceCharts({ summary }: { summary: FinanceSummary }) {
  const { monthly, categories } = summary;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Przychody vs koszty (12 mies.)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} width={48} />
              <Tooltip formatter={currencyTooltip} />
              <Legend />
              <Bar
                dataKey="revenue"
                name="Przychód"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Koszty"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zysk netto (12 mies.)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} width={48} />
              <Tooltip formatter={currencyTooltip} />
              <Line
                type="monotone"
                dataKey="profit"
                name="Zysk netto"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">
            Koszty wg kategorii (bieżący miesiąc)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Brak wydatków w tym miesiącu.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="amount"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(props) => {
                    const p = props as { name?: string; value?: number };
                    return `${p.name}: ${formatCurrency(Number(p.value))}`;
                  }}
                >
                  {categories.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={currencyTooltip} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
