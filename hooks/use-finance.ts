/**
 * Plik: hooks/use-finance.ts
 * Cel: Hooki SWR modułu finansowego — podsumowanie dashboardu, listy wydatków
 *      i przychodów (z filtrami), cele.
 * Zależności: swr, lib/fetcher, hooks/use-orders (buildQuery), types.
 */
'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { buildQuery } from '@/hooks/use-orders';
import type { FinanceSummary, ExpenseRow, IncomeRow, GoalRow } from '@/types';

export function useFinanceSummary() {
  const { data, error, isLoading, mutate } = useSWR<FinanceSummary>(
    '/api/finance/summary',
    fetcher,
  );
  return { summary: data, error, isLoading, mutate };
}

interface ListResponse<T> {
  items: T[];
  total: number;
  sum: number;
  page: number;
  totalPages: number;
}

export function useExpenses(params: Record<string, unknown>) {
  const { data, isLoading, mutate } = useSWR<ListResponse<ExpenseRow>>(
    `/api/expenses${buildQuery(params)}`,
    fetcher,
    { keepPreviousData: true },
  );
  return { data, isLoading, mutate };
}

export function useIncomes(params: Record<string, unknown>) {
  const { data, isLoading, mutate } = useSWR<ListResponse<IncomeRow>>(
    `/api/incomes${buildQuery(params)}`,
    fetcher,
    { keepPreviousData: true },
  );
  return { data, isLoading, mutate };
}

export function useGoals() {
  const { data, isLoading, mutate } = useSWR<{ goals: GoalRow[] }>(
    '/api/goals',
    fetcher,
  );
  return { goals: data?.goals ?? [], isLoading, mutate };
}
