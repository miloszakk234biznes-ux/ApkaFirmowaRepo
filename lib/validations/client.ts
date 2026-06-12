/**
 * Plik: lib/validations/client.ts
 * Cel: Schematy Zod dla klientów (tworzenie + parametry wyszukiwania).
 *      Pełny CRM powstaje w Etapie 4 — tutaj minimum potrzebne do zleceń.
 * Zależności: zod.
 */
import { z } from 'zod';

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v));

export const createClientSchema = z.object({
  firstName: z.string().trim().min(1, 'Podaj imię').max(100),
  lastName: z.string().trim().min(1, 'Podaj nazwisko').max(100),
  phone: optionalText,
  email: z
    .string()
    .email('Nieprawidłowy e-mail')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  address: optionalText,
  city: optionalText,
  notes: optionalText,
});
export type CreateClientInput = z.infer<typeof createClientSchema>;

export const clientSearchSchema = z.object({
  q: optionalText,
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
