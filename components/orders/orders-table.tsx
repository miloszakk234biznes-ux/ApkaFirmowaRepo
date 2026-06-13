/**
 * Plik: components/orders/orders-table.tsx
 * Cel: Lista zleceń z wyszukiwaniem, filtrem statusu, sortowaniem (klik nagłówka),
 *      paginacją i akcjami (nowe/edycja/usuń). Dane przez SWR (useOrders).
 * Zależności: hooks/use-orders, components/ui/*, components/orders/*.
 * Użycie: app/(dashboard)/orders/page.tsx.
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Role, OrderStatus } from '@prisma/client';
import { Plus, Search, ArrowUpDown, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useOrders } from '@/hooks/use-orders';
import { apiRequest, fetcher } from '@/lib/fetcher';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ORDER_STATUS_OPTIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { OrderFormDialog } from '@/components/orders/order-form-dialog';
import type { OrderDetail } from '@/types';

const ALL = 'ALL';

export function OrdersTable({ role }: { role: Role }) {
  const [q, setQ] = React.useState('');
  const [debouncedQ, setDebouncedQ] = React.useState('');
  const [status, setStatus] = React.useState<string>(ALL);
  const [sort, setSort] = React.useState('scheduledAt');
  const [order, setOrder] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<OrderDetail | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, mutate } = useOrders({
    q: debouncedQ,
    status: status === ALL ? undefined : status,
    sort,
    order,
    page,
    pageSize: 15,
  });

  function toggleSort(field: string) {
    if (sort === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder('asc');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Usunąć to zlecenie? Operacji nie można cofnąć.')) return;
    try {
      await apiRequest(`/api/orders/${id}`, 'DELETE');
      toast.success('Zlecenie usunięte');
      mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd usuwania');
    }
  }

  async function openEdit(id: string) {
    try {
      const res = await fetcher<{ order: OrderDetail }>(`/api/orders/${id}`);
      setEditing(res.order);
      setDialogOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Nie udało się pobrać');
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
            placeholder="Szukaj: tytuł, klient, adres…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Wszystkie statusy</SelectItem>
              {ORDER_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nowe
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
                  onClick={() => toggleSort('title')}
                >
                  Tytuł <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Klient</TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1"
                  onClick={() => toggleSort('scheduledAt')}
                >
                  Termin <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                <button
                  className="ml-auto flex items-center gap-1"
                  onClick={() => toggleSort('amount')}
                >
                  Kwota <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">Akcje</TableHead>
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
                  Brak zleceń. Dodaj pierwsze zlecenie przyciskiem „Nowe".
                </TableCell>
              </TableRow>
            )}
            {items.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">
                  <Link href={`/orders/${o.id}`} className="hover:underline">
                    {o.title}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {o.client
                    ? `${o.client.firstName} ${o.client.lastName}`
                    : '—'}
                </TableCell>
                <TableCell>
                  {o.scheduledAt ? formatDate(o.scheduledAt) : '—'}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status as OrderStatus} />
                </TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  {formatCurrency(o.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(o.id)}
                      aria-label="Edytuj"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(o.id)}
                      aria-label="Usuń"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginacja */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? `${data.total} zleceń` : ''}
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

      <OrderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={role}
        order={editing}
        onSaved={() => mutate()}
      />
    </div>
  );
}
