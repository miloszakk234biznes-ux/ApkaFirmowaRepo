/**
 * Plik: components/documents/invoices-list.tsx
 * Cel: Centrum dokumentów — lista wystawionych faktur z pobieraniem PDF.
 * Zależności: swr, lib/fetcher, components/ui/*.
 */
'use client';

import useSWR from 'swr';
import { Download } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface InvoiceRow {
  id: string;
  number: string;
  type: string;
  issueDate: string;
  buyerName: string;
  grossAmount: string;
}

export function InvoicesList({ refreshKey }: { refreshKey?: number }) {
  const { data, isLoading } = useSWR<{ items: InvoiceRow[]; total: number }>(
    `/api/invoices?_=${refreshKey ?? 0}`,
    fetcher,
  );
  const items = data?.items ?? [];

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numer</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead className="hidden md:table-cell">Data</TableHead>
            <TableHead>Nabywca</TableHead>
            <TableHead className="text-right">Brutto</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))}
          {!isLoading && items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-muted-foreground"
              >
                Brak wystawionych faktur.
              </TableCell>
            </TableRow>
          )}
          {items.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell className="font-medium">{inv.number}</TableCell>
              <TableCell>
                {inv.type === 'RECEIPT' ? 'Rachunek' : 'Faktura VAT'}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatDate(inv.issueDate)}
              </TableCell>
              <TableCell className="max-w-[180px] truncate">
                {inv.buyerName}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(inv.grossAmount)}
              </TableCell>
              <TableCell className="text-right">
                <a
                  href={`/api/invoices/${inv.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                  title="Pobierz PDF"
                >
                  <Download className="h-4 w-4" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
