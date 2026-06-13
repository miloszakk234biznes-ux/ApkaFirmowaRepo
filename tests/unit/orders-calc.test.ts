/**
 * Plik: tests/unit/orders-calc.test.ts
 * Cel: Testy wyliczeń zlecenia — pozostała kwota (remaining = amount − deposit).
 */
import { describe, it, expect } from 'vitest';
import { computeRemaining } from '@/lib/orders';

describe('computeRemaining', () => {
  it('odejmuje zaliczkę od kwoty', () => {
    expect(computeRemaining(300, 100)).toBe(200);
  });

  it('nigdy nie zwraca wartości ujemnej', () => {
    expect(computeRemaining(100, 150)).toBe(0);
  });

  it('zaokrągla do groszy', () => {
    expect(computeRemaining(100.555, 0.005)).toBe(100.55);
  });

  it('zwraca 0 dla zerowej kwoty', () => {
    expect(computeRemaining(0, 0)).toBe(0);
  });
});
