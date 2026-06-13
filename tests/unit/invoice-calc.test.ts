/**
 * Plik: tests/unit/invoice-calc.test.ts
 * Cel: Testy wyliczeń faktury (netto/VAT/brutto per pozycja, sumy, podsumowanie
 *      VAT wg stawek) oraz zaokrągleń.
 */
import { describe, it, expect } from 'vitest';
import { computeInvoice } from '@/lib/invoice-calc';

describe('computeInvoice', () => {
  it('liczy netto/VAT/brutto dla pojedynczej pozycji 23%', () => {
    const r = computeInvoice([
      { name: 'Usługa', qty: 2, unitNet: 100, vatRate: 23 },
    ]);
    expect(r.net).toBe(200);
    expect(r.vat).toBe(46);
    expect(r.gross).toBe(246);
  });

  it('sumuje pozycje o różnych stawkach VAT', () => {
    const r = computeInvoice([
      { name: 'A', qty: 2, unitNet: 100, vatRate: 23 }, // net 200, vat 46
      { name: 'B', qty: 1, unitNet: 50, vatRate: 8 }, // net 50, vat 4
    ]);
    expect(r.net).toBe(250);
    expect(r.vat).toBe(50);
    expect(r.gross).toBe(300);
  });

  it('buduje podsumowanie VAT wg stawek (malejąco)', () => {
    const r = computeInvoice([
      { name: 'A', qty: 1, unitNet: 100, vatRate: 8 },
      { name: 'B', qty: 1, unitNet: 100, vatRate: 23 },
    ]);
    expect(r.vatSummary.map((s) => s.rate)).toEqual([23, 8]);
    expect(r.vatSummary[0]).toMatchObject({ rate: 23, net: 100, vat: 23 });
  });

  it('zaokrągla do 2 miejsc po przecinku', () => {
    const r = computeInvoice([
      { name: 'A', qty: 3, unitNet: 33.33, vatRate: 23 },
    ]);
    expect(r.net).toBe(99.99);
    expect(r.vat).toBe(23.0);
  });

  it('stawka 0% nie nalicza VAT', () => {
    const r = computeInvoice([{ name: 'A', qty: 1, unitNet: 100, vatRate: 0 }]);
    expect(r.vat).toBe(0);
    expect(r.gross).toBe(100);
  });
});
