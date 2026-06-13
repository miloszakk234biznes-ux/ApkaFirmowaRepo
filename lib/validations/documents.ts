/**
 * Plik: lib/validations/documents.ts
 * Cel: Schematy Zod dla faktur/rachunków, danych firmy oraz To-Do.
 * Zależności: zod, @prisma/client (InvoiceType, Priority).
 */
import { z } from 'zod';
import { InvoiceType, Priority } from '@prisma/client';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v));
const isoDate = z.string().datetime({ offset: true });

// ── Dane firmy (sprzedawca) ──────────────────────────────────────────────────
export const companySettingsSchema = z.object({
  name: z.string().trim().max(200).default(''),
  nip: optionalText,
  address: optionalText,
  postalCode: optionalText,
  city: optionalText,
  email: z
    .string()
    .email()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: optionalText,
  bankAccount: optionalText,
  logoUrl: optionalText,
  invoicePrefix: z.string().trim().min(1).max(10).default('FV'),
});
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

// ── Faktura ──────────────────────────────────────────────────────────────────
export const invoiceItemSchema = z.object({
  name: z.string().trim().min(1, 'Podaj nazwę pozycji').max(300),
  qty: z.coerce.number().positive('Ilość > 0').default(1),
  unitNet: z.coerce.number().min(0, 'Cena ≥ 0'),
  vatRate: z.coerce.number().int().min(0).max(100).default(23),
});

export const createInvoiceSchema = z.object({
  type: z.nativeEnum(InvoiceType).default(InvoiceType.VAT),
  clientId: optionalText,
  orderId: optionalText,
  buyerName: z.string().trim().min(1, 'Podaj nabywcę').max(200),
  buyerNip: optionalText,
  buyerAddress: optionalText,
  issueDate: isoDate.optional(),
  saleDate: isoDate.optional(),
  dueDate: isoDate.optional(),
  paymentMethod: optionalText,
  notes: optionalText,
  items: z.array(invoiceItemSchema).min(1, 'Dodaj co najmniej jedną pozycję'),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// ── To-Do ────────────────────────────────────────────────────────────────────
export const checklistItemSchema = z.object({
  text: z.string().trim().min(1).max(300),
  done: z.boolean().default(false),
});

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, 'Podaj tytuł').max(200),
  description: optionalText,
  dueDate: isoDate.optional().or(z.literal('').transform(() => undefined)),
  isPrivate: z.coerce.boolean().default(true),
  priority: z.nativeEnum(Priority).default(Priority.NORMAL),
  assignedToId: optionalText,
  checklist: z.array(checklistItemSchema).optional(),
});
export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export const updateTodoSchema = createTodoSchema.partial().extend({
  completed: z.coerce.boolean().optional(),
});
