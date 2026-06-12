/**
 * Plik: lib/periods.ts
 * Cel: Predefiniowane zakresy dat dla filtrów finansowych (dzień/tydzień/miesiąc/
 *      rok/wszystko) — zwraca ISO from/to do zapytań API.
 * Zależności: date-fns.
 */
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';

export type PeriodKey = 'day' | 'week' | 'month' | 'year' | 'all';

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'day', label: 'Dziś' },
  { value: 'week', label: 'Ten tydzień' },
  { value: 'month', label: 'Ten miesiąc' },
  { value: 'year', label: 'Ten rok' },
  { value: 'all', label: 'Wszystko' },
];

/** Zwraca zakres ISO {from,to} dla wybranego okresu (lub puste dla 'all'). */
export function periodRange(key: PeriodKey): { from?: string; to?: string } {
  const now = new Date();
  switch (key) {
    case 'day':
      return {
        from: startOfDay(now).toISOString(),
        to: endOfDay(now).toISOString(),
      };
    case 'week':
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
        to: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
      };
    case 'month':
      return {
        from: startOfMonth(now).toISOString(),
        to: endOfMonth(now).toISOString(),
      };
    case 'year':
      return {
        from: startOfYear(now).toISOString(),
        to: endOfYear(now).toISOString(),
      };
    case 'all':
    default:
      return {};
  }
}
