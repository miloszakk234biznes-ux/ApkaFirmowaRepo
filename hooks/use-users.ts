/**
 * Plik: hooks/use-users.ts
 * Cel: Hook SWR z listą pracowników (do przypisania zleceń i filtrów). Pobiera
 *      tylko gdy `enabled` (admin) — pracownik nie ma dostępu do /api/users.
 * Zależności: swr, lib/fetcher, types.
 */
'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { UserLite } from '@/types';

export function useUsers(enabled: boolean) {
  const { data, error, isLoading } = useSWR<{ users: UserLite[] }>(
    enabled ? '/api/users' : null,
    fetcher,
  );
  return { users: data?.users ?? [], error, isLoading };
}
