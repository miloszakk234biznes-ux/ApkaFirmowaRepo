/**
 * Plik: components/finances/goals-tab.tsx
 * Cel: Cele finansowe — formularz ustawiania celu (miesiąc/rok, przychód, zysk,
 *      liczba zleceń) oraz lista zapisanych celów. Postęp bieżącego celu pokazuje
 *      widget na zakładce „Przegląd".
 * Zależności: hooks/use-finance, react-hook-form, zod, components/ui/*.
 */
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  upsertGoalSchema,
  type UpsertGoalInput,
} from '@/lib/validations/finance';
import { useGoals } from '@/hooks/use-finance';
import { apiRequest } from '@/lib/fetcher';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MONTHS = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];

export function GoalsTab({ onChanged }: { onChanged?: () => void }) {
  const now = new Date();
  const { goals, mutate } = useGoals();
  const [submitting, setSubmitting] = React.useState(false);

  const { register, handleSubmit } = useForm<UpsertGoalInput>({
    resolver: zodResolver(upsertGoalSchema),
    defaultValues: {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      targetRevenue: 0,
      targetProfit: 0,
      targetOrders: 0,
    },
  });

  async function onSubmit(data: UpsertGoalInput) {
    setSubmitting(true);
    try {
      await apiRequest('/api/goals', 'POST', data);
      toast.success('Cel zapisany');
      mutate();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd zapisu');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ustaw cel miesięczny</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="month">Miesiąc</Label>
                <select
                  id="month"
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base"
                  {...register('month')}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Rok</Label>
                <Input id="year" type="number" {...register('year')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetRevenue">Cel przychodu (zł)</Label>
              <Input
                id="targetRevenue"
                type="number"
                step="0.01"
                {...register('targetRevenue')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetProfit">Cel zysku (zł)</Label>
              <Input
                id="targetProfit"
                type="number"
                step="0.01"
                {...register('targetProfit')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetOrders">Cel liczby zleceń</Label>
              <Input
                id="targetOrders"
                type="number"
                {...register('targetOrders')}
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Zapisywanie…' : 'Zapisz cel'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zapisane cele</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {goals.length === 0 && (
            <p className="text-sm text-muted-foreground">Brak celów.</p>
          )}
          {goals.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between rounded-md border p-3 text-sm"
            >
              <span className="font-medium">
                {MONTHS[g.month - 1]} {g.year}
              </span>
              <span className="text-muted-foreground">
                Przychód: {formatCurrency(g.targetRevenue)} · Zlecenia:{' '}
                {g.targetOrders}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
