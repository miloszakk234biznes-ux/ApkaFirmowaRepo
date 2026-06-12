/**
 * Plik: lib/utils.ts
 * Cel: Pomocnicze funkcje narzędziowe wspólne dla UI.
 *      `cn` łączy klasy Tailwind z poprawnym rozwiązywaniem konfliktów.
 * Zależności: clsx, tailwind-merge.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Łączy klasy CSS, scalając konfliktujące klasy Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatuje kwotę jako walutę PLN. */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(Number.isFinite(num) ? num : 0);
}

/** Formatuje datę w polskim formacie. */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}
