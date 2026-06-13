/**
 * Plik: components/clients/clients-table.tsx
 * Cel: Lista klientów (CRM) — fulltext search, sortowanie, paginacja, agregaty
 *      (liczba zleceń, łączna wartość, ostatnia wizyta), dodawanie i export XLSX.
 * Zależności: hooks/use-clients, components/ui/*, components/clients/client-form-dialog.
 * Użycie: app/(dashboard)/clients/page.tsx.
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, Search, ArrowUpDown, Download } from 'lucide-react';
import { useClientsList } from '@/hooks/use-clients';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';

export function ClientsTable() {
  const [q, setQ] = React.useState('');
  const [debouncedQ, setDebouncedQ] = React.useState('');
  const [sort, setSort] = React.useState('lastName');
  const [order, setOrder] = React.useState<'asc' | 'desc'>('asc');
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, mutate } = useClientsList({
    q: debouncedQ,
    sort,
    order,
    page,
    pageSize: 15,
  });

  function toggleSort(field: string) {
    if (sort === field) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(field);
      setOrder('asc');
    }
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj: nazwisko, telefon, adres…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a
              href={`/api/clients/export${debouncedQ ? `?q=${encodeURIComponent(debouncedQ)}` : ''}`}
            >
              <Download className="h-4 w-4" /> Export XLSX
            </a>
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Nowy klient
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="flex items-center gap-1"
                  onClick={() => toggleSort('lastName')}
                >
                  Klient <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Telefon</TableHead>
              <TableHead className="hidden lg:table-cell">Miasto</TableHead>
              <TableHead className="text-right">
                <button
                  className="ml-auto flex items-center gap-1"
                  onClick={() => toggleSort('ordersCount')}
                >
                  Zlecenia <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                <button
                  className="ml-auto flex items-center gap-1"
                  onClick={() => toggleSort('totalValue')}
                >
                  Wartość <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="hidden text-right md:table-cell">
                <button
                  className="ml-auto flex items-center gap-1"
                  onClick={() => toggleSort('lastVisit')}
                >
                  Ostatnia wizyta <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
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
                  className="py-10 text-center text-muted-foreground"
                >
                  Brak klientów. Dodaj pierwszego przyciskiem „Nowy klient".
                </TableCell>
              </TableRow>
            )}
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <Link href={`/clients/${c.id}`} className="hover:underline">
                    {c.firstName} {c.lastName}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {c.phone ?? '—'}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {c.city ?? '—'}
                </TableCell>
                <TableCell className="text-right">{c.ordersCount}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  {formatCurrency(c.totalValue)}
                </TableCell>
                <TableCell className="hidden text-right md:table-cell">
                  {c.lastVisit ? formatDate(c.lastVisit) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? `${data.total} klientów` : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Poprzednia
          </Button>
          <span className="text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Następna
          </Button>
        </div>
      </div>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => mutate()}
      />
    </div>
  );
}
