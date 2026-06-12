/**
 * Plik: lib/validations/auth.ts
 * Cel: Schematy walidacji Zod dla operacji autoryzacji (rejestracja,
 *      logowanie, reset hasła). Używane zarówno na froncie (react-hook-form)
 *      jak i na backendzie (API routes).
 * Zależności: zod.
 */
import { z } from 'zod';

/** Wspólne reguły dla hasła: min. 8 znaków, litera + cyfra. */
const passwordSchema = z
  .string()
  .min(8, 'Hasło musi mieć co najmniej 8 znaków')
  .regex(/[a-zA-Z]/, 'Hasło musi zawierać literę')
  .regex(/[0-9]/, 'Hasło musi zawierać cyfrę');

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Podaj imię i nazwisko').max(100),
    email: z.string().email('Nieprawidłowy adres e-mail'),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\s-]{7,20}$/, 'Nieprawidłowy numer telefonu')
      .optional()
      .or(z.literal('')),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła nie są zgodne',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres e-mail'),
  password: z.string().min(1, 'Podaj hasło'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Nieprawidłowy adres e-mail'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Brak tokenu resetu'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła nie są zgodne',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
