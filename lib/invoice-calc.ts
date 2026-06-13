/**
 * Plik: lib/invoice-calc.ts
 * Cel: Czyste wyliczenia kwot faktury (netto/VAT/brutto per pozycja, sumy oraz
 *      podsumowanie VAT wg stawek). Współdzielone przez API i generator PDF.
 * Zależności: brak.
 */
export interface InvoiceItem {
  name: string;
  qty: number;
  unitNet: number;
  vatRate: number;
}

export interface ComputedItem extends InvoiceItem {
  net: number;
  vat: number;
  gross: number;
}

export interface InvoiceTotals {
  items: ComputedItem[];
  net: number;
  vat: number;
  gross: number;
  vatSummary: { rate: number; net: number; vat: number; gross: number }[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Wylicza pozycje, sumy oraz podsumowanie VAT wg stawek. */
export function computeInvoice(items: InvoiceItem[]): InvoiceTotals {
  const computed: ComputedItem[] = items.map((it) => {
    const net = round2(it.qty * it.unitNet);
    const vat = round2((net * it.vatRate) / 100);
    return { ...it, net, vat, gross: round2(net + vat) };
  });

  const byRate = new Map<number, { net: number; vat: number; gross: number }>();
  for (const it of computed) {
    const cur = byRate.get(it.vatRate) ?? { net: 0, vat: 0, gross: 0 };
    cur.net = round2(cur.net + it.net);
    cur.vat = round2(cur.vat + it.vat);
    cur.gross = round2(cur.gross + it.gross);
    byRate.set(it.vatRate, cur);
  }

  const net = round2(computed.reduce((s, i) => s + i.net, 0));
  const vat = round2(computed.reduce((s, i) => s + i.vat, 0));
  const gross = round2(net + vat);

  const vatSummary = [...byRate.entries()]
    .map(([rate, v]) => ({ rate, ...v }))
    .sort((a, b) => b.rate - a.rate);

  return { items: computed, net, vat, gross, vatSummary };
}
