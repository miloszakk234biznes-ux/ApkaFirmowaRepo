/**
 * Plik: lib/constants.ts
 * Cel: Centralne słowniki domenowe (etykiety PL, kolory statusów) używane w
 *      formularzach, kalendarzu, tabelach i znacznikach (badge).
 * Zależności: @prisma/client (enumy).
 */
import {
  OrderStatus,
  Priority,
  PaymentMethod,
  PaymentStatus,
  ExpenseCategory,
} from '@prisma/client';

/** Statusy zleceń: etykieta + klasa koloru (kropki/tła) zgodna z tailwind.config. */
export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; dot: string; badge: string }
> = {
  NEW: {
    label: 'Nowe',
    dot: 'bg-status-new',
    badge: 'bg-status-new/15 text-status-new border-status-new/30',
  },
  CONFIRMED: {
    label: 'Potwierdzone',
    dot: 'bg-status-confirmed',
    badge:
      'bg-status-confirmed/15 text-status-confirmed border-status-confirmed/30',
  },
  IN_PROGRESS: {
    label: 'W trakcie',
    dot: 'bg-status-progress',
    badge:
      'bg-status-progress/15 text-status-progress border-status-progress/30',
  },
  DONE: {
    label: 'Zakończone',
    dot: 'bg-status-done',
    badge: 'bg-status-done/15 text-status-done border-status-done/30',
  },
  CANCELLED: {
    label: 'Anulowane',
    dot: 'bg-status-cancelled',
    badge:
      'bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30',
  },
  UNPAID: {
    label: 'Nieopłacone',
    dot: 'bg-status-unpaid',
    badge: 'bg-status-unpaid/15 text-status-unpaid border-status-unpaid/30',
  },
};

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(
  ([value, meta]) => ({ value: value as OrderStatus, label: meta.label }),
);

export const PRIORITY: Record<Priority, { label: string; className: string }> =
  {
    LOW: { label: 'Niski', className: 'text-muted-foreground' },
    NORMAL: { label: 'Normalny', className: 'text-foreground' },
    HIGH: { label: 'Wysoki', className: 'text-amber-600 dark:text-amber-400' },
    URGENT: { label: 'Pilny', className: 'text-red-600 dark:text-red-400' },
  };

export const PRIORITY_OPTIONS = Object.entries(PRIORITY).map(
  ([value, meta]) => ({ value: value as Priority, label: meta.label }),
);

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  CASH: 'Gotówka',
  CARD: 'Karta',
  TRANSFER: 'Przelew',
  BLIK: 'BLIK',
  OTHER: 'Inna',
};

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD).map(
  ([value, label]) => ({ value: value as PaymentMethod, label }),
);

export const PAYMENT_STATUS: Record<PaymentStatus, string> = {
  UNPAID: 'Nieopłacone',
  PARTIAL: 'Częściowo',
  PAID: 'Opłacone',
};

export const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS).map(
  ([value, label]) => ({ value: value as PaymentStatus, label }),
);

/** 18 kategorii wydatków — etykiety PL. */
export const EXPENSE_CATEGORY: Record<ExpenseCategory, string> = {
  FUEL: 'Paliwo',
  EQUIPMENT: 'Sprzęt',
  TOOLS: 'Narzędzia',
  MATERIALS: 'Materiały',
  ADS: 'Reklama',
  MARKETING: 'Marketing',
  LEASING: 'Leasing',
  INSTALLMENT: 'Raty',
  PHONE: 'Telefon',
  INTERNET: 'Internet',
  ZUS: 'ZUS',
  TAXES: 'Podatki',
  ACCOUNTING: 'Księgowość',
  SALARIES: 'Wynagrodzenia',
  TRAINING: 'Szkolenia',
  REPAIRS: 'Naprawy',
  INSURANCE: 'Ubezpieczenia',
  OTHER: 'Inne',
};

export const EXPENSE_CATEGORY_OPTIONS = Object.entries(EXPENSE_CATEGORY).map(
  ([value, label]) => ({ value: value as ExpenseCategory, label }),
);

/** Typowe rodzaje usług (podpowiedzi do pola serviceType). */
export const SERVICE_TYPES = [
  'Sprzątanie',
  'Serwis',
  'Instalacja',
  'Naprawa',
  'Przegląd',
  'Montaż',
  'Konserwacja',
  'Inne',
];
