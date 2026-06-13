/**
 * Plik: lib/validations/user.ts
 * Cel: Schematy Zod dla zarządzania pracownikami przez administratora —
 *      tworzenie konta oraz aktualizacja (rola, blokada, dane).
 * Zależności: zod, @prisma/client (Role).
 */
import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Podaj imię i nazwisko').max(100),
  email: z.string().email('Nieprawidłowy e-mail'),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  password: z
    .string()
    .min(8, 'Hasło min. 8 znaków')
    .regex(/[a-zA-Z]/, 'Hasło musi zawierać literę')
    .regex(/[0-9]/, 'Hasło musi zawierać cyfrę'),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  active: z.coerce.boolean().optional(),
  // Opcjonalny reset hasła przez admina.
  password: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/)
    .regex(/[0-9]/)
    .optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
