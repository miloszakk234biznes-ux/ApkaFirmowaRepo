/**
 * Plik: tests/unit/helpers.test.ts
 * Cel: Testy czystych pomocników — fulltext tsquery (prefiks), zakresy okresów,
 *      formatowanie waluty/dat, deeplink trasy mapy.
 */
import { describe, it, expect } from 'vitest';
import { buildTsQuery } from '@/lib/clients';
import { periodRange } from '@/lib/periods';
import { formatCurrency } from '@/lib/utils';
import { buildRouteDeeplink } from '@/components/map/orders-map';

describe('buildTsQuery', () => {
  it('buduje zapytanie prefiksowe z wielu słów', () => {
    expect(buildTsQuery('kow jan')).toBe('kow:* & jan:*');
  });

  it('usuwa znaki specjalne (ochrona przed injekcją)', () => {
    expect(buildTsQuery('a&b|c:*')).toBe('a:* & b:* & c:*');
  });

  it('zwraca null dla pustej frazy', () => {
    expect(buildTsQuery('')).toBeNull();
    expect(buildTsQuery(null)).toBeNull();
    expect(buildTsQuery('   ')).toBeNull();
  });
});

describe('periodRange', () => {
  it('zwraca pusty zakres dla "all"', () => {
    expect(periodRange('all')).toEqual({});
  });

  it('zwraca from/to dla miesiąca', () => {
    const r = periodRange('month');
    expect(r.from).toBeDefined();
    expect(r.to).toBeDefined();
    expect(new Date(r.from!).getTime()).toBeLessThan(new Date(r.to!).getTime());
  });
});

describe('formatCurrency', () => {
  it('formatuje PLN', () => {
    // Niełamliwa spacja jako separator tysięcy w pl-PL.
    expect(formatCurrency(1234.5)).toContain('zł');
    expect(formatCurrency(0)).toContain('0,00');
  });
});

describe('buildRouteDeeplink', () => {
  it('zwraca null bez adresów', () => {
    expect(buildRouteDeeplink([])).toBeNull();
  });

  it('buduje deeplink z optymalizacją dla wielu przystanków', () => {
    const url = buildRouteDeeplink(['Adres A', 'Adres B', 'Adres C']);
    expect(url).toContain('optimize:true');
    expect(url).toContain('destination=');
  });
});
