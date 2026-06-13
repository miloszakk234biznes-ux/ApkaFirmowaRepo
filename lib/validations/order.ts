/**
 * Plik: lib/validations/order.ts
 * Cel: Schematy Zod dla zleceń — tworzenie, aktualizacja, zmiana statusu oraz
 *      parametry zapytań listy (filtry/paginacja/sort). Wspólne dla front i API.
 * Zależności: zod, @prisma/client (enumy).
 */
import { z } from 'zod';
import {
  OrderStatus,
  Priority,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

/** Akceptuje liczbę lub pusty/numeryczny string i zwraca number ≥ 0. */
const money = z.coerce.number().min(0, 'Kwota nie może być ujemna').default(0);

/** Pole opcjonalne tekstowe — pusty string traktujemy jako brak. */
const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

export const orderBaseSchema = z.object({
  title: z.string().trim().min(2, 'Podaj tytuł zlecenia').max(200),
  // Klient: istniejący (clientId) lub dane do utworzenia nowego.
  clientId: optionalText,
  clientFirstName: optionalText,
  clientLastName: optionalText,
  clientPhone: optionalText,
  assignedUserId: optionalText,
  serviceType: optionalText,
  description: optionalText,
  address: optionalText,
  // ISO string (datetime-local na froncie) lub brak.
  scheduledAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.literal('').transform(() => undefined)),
  estimatedDuration: z.coerce.number().int().min(0).max(1440).optional(),
  status: z.nativeEnum(OrderStatus).default(OrderStatus.NEW),
  priority: z.nativeEnum(Priority).default(Priority.NORMAL),
  amount: money,
  deposit: money,
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
  isRecurring: z.coerce.boolean().default(false),
  recurringRule: optionalText,
  notes: optionalText,
});

/** Tworzenie — wymaga albo clientId, albo imienia+nazwiska nowego klienta. */
export const createOrderSchema = orderBaseSchema.refine(
  (d) => !!d.clientId || (!!d.clientFirstName && !!d.clientLastName),
  {
    message: 'Wybierz klienta z bazy lub podaj imię i nazwisko nowego klienta',
    path: ['clientLastName'],
  },
);

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Aktualizacja — wszystkie pola opcjonalne (partial). */
export const updateOrderSchema = orderBaseSchema.partial();
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

/** Zmiana statusu z opcjonalną notatką (osobny, lekki endpoint). */
export const changeStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: optionalText,
});
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;

/** Zmiana terminu (drag & drop w kalendarzu). */
export const rescheduleSchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }),
});

/** Parametry listy zleceń. */
export const orderQuerySchema = z.object({
  q: optionalText,
  status: z.nativeEnum(OrderStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  serviceType: optionalText,
  assignedUserId: optionalText,
  from: optionalText, // ISO date (włącznie)
  to: optionalText, // ISO date (włącznie)
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['scheduledAt', 'createdAt', 'amount', 'status', 'title'])
    .default('scheduledAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export type OrderQuery = z.infer<typeof orderQuerySchema>;
