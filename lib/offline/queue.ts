/**
 * Plik: lib/offline/queue.ts
 * Cel: Operacje na kolejce offline — dodawanie rekordów, zliczanie oczekujących,
 *      wysyłka z fallbackiem offline oraz opróżnianie kolejki po odzyskaniu sieci
 *      (z rejestracją Background Sync, jeśli dostępne). Strategia konfliktów:
 *      „last write wins" (znacznik clientUpdatedAt wysyłany do API).
 * Zależności: lib/offline/db, lib/fetcher.
 */
import { getDb, type PendingType } from '@/lib/offline/db';
import { apiRequest, ApiError } from '@/lib/fetcher';

/** Czy aktualnie jesteśmy offline. */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/** Dodaje rekord do kolejki offline i (jeśli można) rejestruje Background Sync. */
export async function enqueue(
  type: PendingType,
  endpoint: string,
  payload: unknown,
  method: 'POST' | 'PATCH' = 'POST',
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error('IndexedDB niedostępne');
  const now = Date.now();
  await db.pending.add({
    type,
    endpoint,
    method,
    payload,
    clientUpdatedAt: now,
    createdAt: now,
  });
  await registerBackgroundSync();
}

/** Liczba rekordów oczekujących na synchronizację. */
export async function pendingCount(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  return db.pending.count();
}

/**
 * Wysyła żądanie, a przy braku sieci/błędzie sieciowym zapisuje je w kolejce
 * offline. Zwraca `{ offline: true }` gdy rekord trafił do kolejki.
 */
export async function submitWithOfflineFallback<T>(
  type: PendingType,
  endpoint: string,
  payload: unknown,
  method: 'POST' | 'PATCH' = 'POST',
): Promise<{ offline: false; data: T } | { offline: true }> {
  if (isOffline()) {
    await enqueue(type, endpoint, payload, method);
    return { offline: true };
  }
  try {
    const data = await apiRequest<T>(endpoint, method, payload);
    return { offline: false, data };
  } catch (err) {
    // Błąd sieci (nie błąd walidacji 4xx) → kolejkujemy.
    if (!(err instanceof ApiError)) {
      await enqueue(type, endpoint, payload, method);
      return { offline: true };
    }
    throw err;
  }
}

/** Opróżnia kolejkę — wysyła oczekujące rekordy po kolei. Zwraca liczbę wysłanych. */
export async function flushQueue(): Promise<number> {
  const db = getDb();
  if (!db || isOffline()) return 0;
  const records = await db.pending.orderBy('createdAt').toArray();
  let sent = 0;
  for (const rec of records) {
    try {
      await apiRequest(rec.endpoint, rec.method, {
        ...(rec.payload as object),
        clientUpdatedAt: rec.clientUpdatedAt,
      });
      if (rec.id != null) await db.pending.delete(rec.id);
      sent++;
    } catch (err) {
      // 4xx → rekord błędny, usuwamy by nie blokować kolejki; sieć → przerwij.
      if (err instanceof ApiError) {
        if (rec.id != null) await db.pending.delete(rec.id);
      } else {
        break;
      }
    }
  }
  return sent;
}

/** Rejestruje Background Sync (jeśli przeglądarka wspiera), inaczej no-op. */
async function registerBackgroundSync(): Promise<void> {
  try {
    if (
      typeof navigator === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('SyncManager' in window)
    ) {
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    // @ts-expect-error - sync nie jest w typach lib.dom
    await reg.sync.register('apka-sync');
  } catch {
    // brak wsparcia — synchronizacja nastąpi po zdarzeniu 'online'
  }
}
