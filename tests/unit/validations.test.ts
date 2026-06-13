/**
 * Plik: tests/unit/validations.test.ts
 * Cel: Testy schematów Zod — rejestracja, zlecenie (wymóg klienta), wydatek,
 *      faktura (pozycje), kategorie wydatków.
 */
import { describe, it, expect } from 'vitest';
import { registerSchema } from '@/lib/validations/auth';
import { createOrderSchema } from '@/lib/validations/order';
import { createExpenseSchema } from '@/lib/validations/finance';
import { createInvoiceSchema } from '@/lib/validations/documents';

describe('registerSchema', () => {
  it('odrzuca niezgodne hasła', () => {
    const r = registerSchema.safeParse({
      name: 'Jan Kowalski',
      email: 'jan@test.pl',
      password: 'Haslo123',
      confirmPassword: 'Inne123',
    });
    expect(r.success).toBe(false);
  });

  it('odrzuca hasło bez cyfry', () => {
    const r = registerSchema.safeParse({
      name: 'Jan Kowalski',
      email: 'jan@test.pl',
      password: 'bezcyfry',
      confirmPassword: 'bezcyfry',
    });
    expect(r.success).toBe(false);
  });

  it('akceptuje poprawne dane', () => {
    const r = registerSchema.safeParse({
      name: 'Jan Kowalski',
      email: 'jan@test.pl',
      password: 'Haslo123',
      confirmPassword: 'Haslo123',
    });
    expect(r.success).toBe(true);
  });
});

describe('createOrderSchema', () => {
  it('wymaga klienta lub danych nowego klienta', () => {
    const r = createOrderSchema.safeParse({ title: 'Zlecenie', amount: 100 });
    expect(r.success).toBe(false);
  });

  it('akceptuje nowego klienta (imię + nazwisko)', () => {
    const r = createOrderSchema.safeParse({
      title: 'Zlecenie',
      clientFirstName: 'Anna',
      clientLastName: 'Nowak',
      amount: 100,
    });
    expect(r.success).toBe(true);
  });

  it('odrzuca ujemną kwotę', () => {
    const r = createOrderSchema.safeParse({
      title: 'Zlecenie',
      clientId: 'abc',
      amount: -5,
    });
    expect(r.success).toBe(false);
  });
});

describe('createExpenseSchema', () => {
  it('wymaga prawidłowej kategorii', () => {
    const r = createExpenseSchema.safeParse({ amount: 10, category: 'XYZ' });
    expect(r.success).toBe(false);
  });

  it('akceptuje poprawny wydatek', () => {
    const r = createExpenseSchema.safeParse({ amount: 10, category: 'FUEL' });
    expect(r.success).toBe(true);
  });
});

describe('createInvoiceSchema', () => {
  it('wymaga co najmniej jednej pozycji', () => {
    const r = createInvoiceSchema.safeParse({
      buyerName: 'Nabywca',
      items: [],
    });
    expect(r.success).toBe(false);
  });

  it('akceptuje fakturę z pozycją', () => {
    const r = createInvoiceSchema.safeParse({
      buyerName: 'Nabywca',
      items: [{ name: 'Usługa', qty: 1, unitNet: 100, vatRate: 23 }],
    });
    expect(r.success).toBe(true);
  });
});
