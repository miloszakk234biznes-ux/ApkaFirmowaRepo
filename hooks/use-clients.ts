/**
 * Plik: hooks/use-clients.ts
 * Cel: Hooki SWR dla CRM — paginowana lista klientów oraz szczegóły klienta.
 * Zależności: swr, lib/fetcher, hooks/use-orders (buildQuery), types.
 */
'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { buildQuery } from '@/hooks/use-orders';
import type { ClientsListResponse, ClientDetailResponse } from '@/types';

export function useClientsList(params: Record<string, unknown>) {
  const key = `/api/clients${buildQuery({ ...params })}`;
  const { data, error, isLoading, mutate } = useSWR<ClientsListResponse>(
    key,
    fetcher,
    { keepPreviousData: true },
  );
  return { data, error, isLoading, mutate };
}

export function useClientDetail(id: string) {
  const { data, error, isLoading, mutate } = useSWR<ClientDetailResponse>(
    `/api/clients/${id}`,
    fetcher,
  );
  return { data, error, isLoading, mutate };
}
