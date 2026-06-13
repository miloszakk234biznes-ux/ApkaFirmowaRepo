/**
 * Plik: lib/invoices.ts
 * Cel: Pomocniki faktur — generowanie kolejnego numeru (PREFIX/NNNN/MM/RRRR) oraz
 *      budowa danych PDF z rekordu Invoice.
 * Zależności: lib/prisma, lib/pdf.
 */
import { prisma } from '@/lib/prisma';
import type { InvoicePdfData, InvoiceSeller } from '@/lib/pdf';
import type { InvoiceItem } from '@/lib/invoice-calc';

/** Następny numer faktury w danym miesiącu/roku (licznik miesięczny). */
export async function nextInvoiceNumber(
  prefix: string,
  date: Date,
): Promise<string> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const count = await prisma.invoice.count({
    where: { issueDate: { gte: start, lt: end } },
  });
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}/${seq}/${String(month).padStart(2, '0')}/${year}`;
}

interface InvoiceRecord {
  number: string;
  type: string;
  issueDate: Date;
  saleDate: Date;
  dueDate: Date | null;
  seller: unknown;
  buyerName: string;
  buyerNip: string | null;
  buyerAddress: string | null;
  items: unknown;
  paymentMethod: string | null;
  notes: string | null;
}

/** Mapuje rekord Invoice z bazy na dane wejściowe generatora PDF. */
export function invoiceToPdfData(inv: InvoiceRecord): InvoicePdfData {
  return {
    number: inv.number,
    type: inv.type === 'RECEIPT' ? 'RECEIPT' : 'VAT',
    issueDate: inv.issueDate,
    saleDate: inv.saleDate,
    dueDate: inv.dueDate,
    seller: inv.seller as InvoiceSeller,
    buyerName: inv.buyerName,
    buyerNip: inv.buyerNip,
    buyerAddress: inv.buyerAddress,
    items: inv.items as InvoiceItem[],
    paymentMethod: inv.paymentMethod,
    notes: inv.notes,
  };
}
