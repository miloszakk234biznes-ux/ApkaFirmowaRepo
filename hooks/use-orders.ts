/**
 * Plik: hooks/use-orders.ts
 * Cel: Hooki SWR do pobierania zleceń (lista z filtrami oraz zakres dla kalendarza).
 * Zależności: swr, lib/fetcher, types.
 */
'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { OrdersResponse } from '@/types';

/** Buduje query string z obiektu, pomijając puste wartości. */
export function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/** Lista zleceń (tabela) z filtrami/paginacją. */
export function useOrders(params: Record<string, unknown>) {
  const key = `/api/orders${buildQuery(params)}`;
  const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(
    key,
    fetcher,
    { keepPreviousData: true },
  );
  return { data, error, isLoading, mutate };
}

/** Zlecenia w zakresie dat (kalendarz). pageSize duży, by objąć cały miesiąc. */
export function useCalendarOrders(
  from: string,
  to: string,
  filters: Record<string, unknown> = {},
) {
  const key = `/api/orders${buildQuery({ from, to, pageSize: 100, sort: 'scheduledAt', order: 'asc', ...filters })}`;
  const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(
    key,
    fetcher,
    { keepPreviousData: true },
  );
  return { orders: data?.items ?? [], error, isLoading, mutate };
}
