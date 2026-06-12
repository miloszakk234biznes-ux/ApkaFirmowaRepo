/**
 * Plik: lib/calendar-utils.ts
 * Cel: Pomocniki dat dla kalendarza (siatka miesiąca/tygodnia, etykiety PL,
 *      grupowanie zleceń po dniach). Tydzień zaczyna się w poniedziałek.
 * Zależności: date-fns, date-fns/locale (pl).
 */
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfDay,
  format,
  isSameDay,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import type { OrderListItem } from '@/types';

const WEEK_OPTS = { weekStartsOn: 1 as const }; // poniedziałek

/** Pełna siatka miesiąca (z dopełnieniem do pełnych tygodni). */
export function monthGrid(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), WEEK_OPTS);
  const end = endOfWeek(endOfMonth(date), WEEK_OPTS);
  return eachDayOfInterval({ start, end });
}

/** Dni bieżącego tygodnia (pon–niedz). */
export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date, WEEK_OPTS);
  const end = endOfWeek(date, WEEK_OPTS);
  return eachDayOfInterval({ start, end });
}

/** Zakres [from, to] w ISO obejmujący widoczną siatkę (do zapytania API). */
export function rangeForMonth(date: Date): { from: string; to: string } {
  const grid = monthGrid(date);
  return {
    from: startOfDay(grid[0]!).toISOString(),
    to: endOfWeek(endOfMonth(date), WEEK_OPTS).toISOString(),
  };
}

export function rangeForWeek(date: Date): { from: string; to: string } {
  const start = startOfWeek(date, WEEK_OPTS);
  const end = endOfWeek(date, WEEK_OPTS);
  return { from: startOfDay(start).toISOString(), to: end.toISOString() };
}

export function rangeForDay(date: Date): { from: string; to: string } {
  const start = startOfDay(date);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

/** Grupuje zlecenia wg dnia (klucz: yyyy-MM-dd lokalnie). */
export function groupByDay(
  orders: OrderListItem[],
): Map<string, OrderListItem[]> {
  const map = new Map<string, OrderListItem[]>();
  for (const o of orders) {
    if (!o.scheduledAt) continue;
    const key = format(new Date(o.scheduledAt), 'yyyy-MM-dd');
    const arr = map.get(key) ?? [];
    arr.push(o);
    map.set(key, arr);
  }
  return map;
}

export function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatMonthLabel(date: Date): string {
  return format(date, 'LLLL yyyy', { locale: pl });
}

export function formatWeekLabel(date: Date): string {
  const days = weekDays(date);
  return `${format(days[0]!, 'd MMM', { locale: pl })} – ${format(days[6]!, 'd MMM yyyy', { locale: pl })}`;
}

export function formatDayLabel(date: Date): string {
  return format(date, 'EEEE, d MMMM yyyy', { locale: pl });
}

export function weekdayHeaders(): string[] {
  return ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];
}

export { isSameDay, format };
