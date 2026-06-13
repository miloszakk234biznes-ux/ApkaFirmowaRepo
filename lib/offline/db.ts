/**
 * Plik: lib/offline/db.ts
 * Cel: Lokalna baza IndexedDB (Dexie) — kolejka rekordów oczekujących na
 *      synchronizację (zlecenia/wydatki zapisane offline) oraz prosty cache
 *      odpowiedzi list do odczytu bez sieci.
 * Zależności: dexie. Uwaga: moduł używany wyłącznie po stronie klienta.
 */
import Dexie, { type Table } from 'dexie';

export type PendingType = 'order' | 'expense' | 'client';

export interface PendingRecord {
  id?: number;
  type: PendingType;
  endpoint: string;
  method: 'POST' | 'PATCH';
  payload: unknown;
  /** Znacznik czasu utworzenia (do strategii „last write wins"). */
  clientUpdatedAt: number;
  createdAt: number;
}

export interface CacheEntry {
  key: string;
  data: unknown;
  updatedAt: number;
}

class OfflineDatabase extends Dexie {
  pending!: Table<PendingRecord, number>;
  cache!: Table<CacheEntry, string>;

  constructor() {
    super('apkafirmowa-offline');
    this.version(1).stores({
      pending: '++id, type, createdAt',
      cache: 'key, updatedAt',
    });
  }
}

let _db: OfflineDatabase | null = null;

/** Zwraca instancję bazy (tylko w przeglądarce). */
export function getDb(): OfflineDatabase | null {
  if (typeof window === 'undefined') return null;
  if (!_db) _db = new OfflineDatabase();
  return _db;
}
