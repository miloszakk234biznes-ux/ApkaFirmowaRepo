/**
 * Plik: lib/validations/client.ts
 * Cel: Schematy Zod dla CRM klientów — tworzenie, aktualizacja, wyszukiwanie
 *      (autocomplete) oraz parametry listy (fulltext + paginacja + sort).
 * Zależności: zod.
 */
import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

const emailField = z
  .string()
  .email('Nieprawidłowy e-mail')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const createClientSchema = z.object({
  firstName: z.string().trim().min(1, 'Podaj imię').max(100),
  lastName: z.string().trim().min(1, 'Podaj nazwisko').max(100),
  phone: optionalText,
  email: emailField,
  address: optionalText,
  city: optionalText,
  notes: optionalText,
});
export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

/** Wyszukiwanie do autocomplete (krótka lista). */
export const clientSearchSchema = z.object({
  q: optionalText,
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

/** Parametry listy CRM (z fulltext, paginacją, sortem). */
export const clientListSchema = z.object({
  q: optionalText,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum(['lastName', 'lastVisit', 'ordersCount', 'totalValue'])
    .default('lastName'),
  order: z.enum(['asc', 'desc']).default('asc'),
});
export type ClientListQuery = z.infer<typeof clientListSchema>;
