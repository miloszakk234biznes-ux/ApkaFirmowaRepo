/**
 * Plik: lib/validations/finance.ts
 * Cel: Schematy Zod dla modułu finansowego — wydatki, przychody, koszty zlecenia,
 *      cele finansowe oraz parametry filtrów/zakresów dat.
 * Zależności: zod, @prisma/client (enumy).
 */
import { z } from 'zod';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

const money = z.coerce.number().min(0, 'Kwota nie może być ujemna');
const isoDate = z.string().datetime({ offset: true });

// ── Wydatki ─────────────────────────────────────────────────────────────────
export const createExpenseSchema = z.object({
  date: isoDate.optional(),
  amount: money,
  category: z.nativeEnum(ExpenseCategory),
  description: optionalText,
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  receiptPhoto: optionalText,
  orderId: optionalText,
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.partial();

// ── Przychody ───────────────────────────────────────────────────────────────
export const createIncomeSchema = z.object({
  date: isoDate.optional(),
  amount: money,
  description: optionalText,
  source: optionalText,
  orderId: optionalText,
});
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;

export const updateIncomeSchema = createIncomeSchema.partial();

// ── Koszty realizacji zlecenia (rentowność) ────────────────────────────────
export const createOrderCostSchema = z.object({
  category: z.string().trim().min(1, 'Podaj kategorię').max(100),
  description: optionalText,
  amount: money,
});
export type CreateOrderCostInput = z.infer<typeof createOrderCostSchema>;

// ── Cele finansowe ──────────────────────────────────────────────────────────
export const upsertGoalSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  targetRevenue: money.default(0),
  targetProfit: money.default(0),
  targetOrders: z.coerce.number().int().min(0).default(0),
});
export type UpsertGoalInput = z.infer<typeof upsertGoalSchema>;

// ── Filtry list ─────────────────────────────────────────────────────────────
export const financeQuerySchema = z.object({
  from: optionalText,
  to: optionalText,
  category: z.nativeEnum(ExpenseCategory).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type FinanceQuery = z.infer<typeof financeQuerySchema>;
