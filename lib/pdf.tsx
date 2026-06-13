/**
 * Plik: lib/pdf.tsx
 * Cel: Generowanie dokumentów PDF (@react-pdf/renderer) — faktura VAT / rachunek
 *      oraz raport finansowy. Renderowane po stronie serwera do bufora.
 * Zależności: @react-pdf/renderer, lib/invoice-calc.
 */
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import { computeInvoice, type InvoiceItem } from '@/lib/invoice-calc';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: 'Helvetica', color: '#111827' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  muted: { color: '#6b7280' },
  parties: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  box: { width: '48%' },
  boxTitle: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    fontSize: 8,
    color: '#6b7280',
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontFamily: 'Helvetica-Bold',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  cName: { width: '34%' },
  cNum: { width: '11%', textAlign: 'right' },
  totals: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: {
    flexDirection: 'row',
    width: 220,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  grand: { fontFamily: 'Helvetica-Bold', fontSize: 11 },
  footer: { marginTop: 24, fontSize: 8, color: '#6b7280' },
});

const fmt = (n: number) =>
  new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
const fmtDate = (d: Date) => new Intl.DateTimeFormat('pl-PL').format(d);

export interface InvoiceSeller {
  name: string;
  nip?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  bankAccount?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface InvoicePdfData {
  number: string;
  type: 'VAT' | 'RECEIPT';
  issueDate: Date;
  saleDate: Date;
  dueDate?: Date | null;
  seller: InvoiceSeller;
  buyerName: string;
  buyerNip?: string | null;
  buyerAddress?: string | null;
  items: InvoiceItem[];
  paymentMethod?: string | null;
  notes?: string | null;
}

function InvoiceDoc({ data }: { data: InvoicePdfData }) {
  const totals = computeInvoice(data.items);
  const docTitle = data.type === 'VAT' ? 'Faktura VAT' : 'Rachunek';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{docTitle}</Text>
            <Text style={styles.muted}>Nr {data.number}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text>Data wystawienia: {fmtDate(data.issueDate)}</Text>
            <Text>Data sprzedaży: {fmtDate(data.saleDate)}</Text>
            {data.dueDate ? (
              <Text>Termin płatności: {fmtDate(data.dueDate)}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.parties}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>SPRZEDAWCA</Text>
            <Text>{data.seller.name}</Text>
            {data.seller.nip ? <Text>NIP: {data.seller.nip}</Text> : null}
            {data.seller.address ? <Text>{data.seller.address}</Text> : null}
            <Text>
              {[data.seller.postalCode, data.seller.city]
                .filter(Boolean)
                .join(' ')}
            </Text>
            {data.seller.bankAccount ? (
              <Text>Konto: {data.seller.bankAccount}</Text>
            ) : null}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>NABYWCA</Text>
            <Text>{data.buyerName}</Text>
            {data.buyerNip ? <Text>NIP: {data.buyerNip}</Text> : null}
            {data.buyerAddress ? <Text>{data.buyerAddress}</Text> : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Pozycje</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.cName}>Nazwa</Text>
          <Text style={styles.cNum}>Ilość</Text>
          <Text style={styles.cNum}>Cena netto</Text>
          <Text style={styles.cNum}>Netto</Text>
          <Text style={styles.cNum}>VAT %</Text>
          <Text style={styles.cNum}>Brutto</Text>
        </View>
        {totals.items.map((it, i) => (
          <View style={styles.row} key={i}>
            <Text style={styles.cName}>{it.name}</Text>
            <Text style={styles.cNum}>{it.qty}</Text>
            <Text style={styles.cNum}>{fmt(it.unitNet)}</Text>
            <Text style={styles.cNum}>{fmt(it.net)}</Text>
            <Text style={styles.cNum}>{it.vatRate}%</Text>
            <Text style={styles.cNum}>{fmt(it.gross)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Razem netto:</Text>
            <Text>{fmt(totals.net)} zł</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Razem VAT:</Text>
            <Text>{fmt(totals.vat)} zł</Text>
          </View>
          <View style={[styles.totalRow, styles.grand]}>
            <Text>Do zapłaty:</Text>
            <Text>{fmt(totals.gross)} zł</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {data.paymentMethod ? (
            <Text>Forma płatności: {data.paymentMethod}</Text>
          ) : null}
          {data.notes ? <Text>Uwagi: {data.notes}</Text> : null}
        </View>
      </Page>
    </Document>
  );
}

/** Renderuje fakturę/rachunek do bufora PDF. */
export function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDoc data={data} />);
}

// ── Raport finansowy ─────────────────────────────────────────────────────────

export interface FinancialReportData {
  title: string;
  periodLabel: string;
  rows: { label: string; revenue: number; expense: number; profit: number }[];
  totals: { revenue: number; expense: number; profit: number };
}

function ReportDoc({ data }: { data: FinancialReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.muted}>{data.periodLabel}</Text>

        <View style={[styles.tableHeader, { marginTop: 16 }]}>
          <Text style={{ width: '40%' }}>Okres</Text>
          <Text style={styles.cNum}>Przychód</Text>
          <Text style={styles.cNum}>Koszty</Text>
          <Text style={styles.cNum}>Zysk</Text>
        </View>
        {data.rows.map((r, i) => (
          <View style={styles.row} key={i}>
            <Text style={{ width: '40%' }}>{r.label}</Text>
            <Text style={styles.cNum}>{fmt(r.revenue)}</Text>
            <Text style={styles.cNum}>{fmt(r.expense)}</Text>
            <Text style={styles.cNum}>{fmt(r.profit)}</Text>
          </View>
        ))}
        <View style={[styles.row, { fontFamily: 'Helvetica-Bold' }]}>
          <Text style={{ width: '40%' }}>RAZEM</Text>
          <Text style={styles.cNum}>{fmt(data.totals.revenue)}</Text>
          <Text style={styles.cNum}>{fmt(data.totals.expense)}</Text>
          <Text style={styles.cNum}>{fmt(data.totals.profit)}</Text>
        </View>
      </Page>
    </Document>
  );
}

/** Renderuje raport finansowy do bufora PDF. */
export function renderFinancialReportPdf(
  data: FinancialReportData,
): Promise<Buffer> {
  return renderToBuffer(<ReportDoc data={data} />);
}
