/**
 * Plik: components/finances/expenses-tab.tsx
 * Cel: Tabela wydatków z filtrami (okres, kategoria), sumą, paragonami, usuwaniem
 *      i dodawaniem (modal). Dane przez SWR.
 * Zależności: hooks/use-finance, components/finances/expense-form-dialog, ui/*.
 */
'use client';

import * as React from 'react';
import { Plus, Trash2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { useExpenses } from '@/hooks/use-finance';
import { apiRequest } from '@/lib/fetcher';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  EXPENSE_CATEGORY,
  EXPENSE_CATEGORY_OPTIONS,
  PAYMENT_METHOD,
} from '@/lib/constants';
import { PERIOD_OPTIONS, periodRange, type PeriodKey } from '@/lib/periods';
import { Button } from '@/components/ui/button';
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
import { ExpenseFormDialog } from '@/components/finances/expense-form-dialog';
import type { PaymentMethod, ExpenseCategory } from '@prisma/client';

const ALL = 'ALL';

export function ExpensesTab({ onChanged }: { onChanged?: () => void }) {
  const [period, setPeriod] = React.useState<PeriodKey>('month');
  const [category, setCategory] = React.useState<string>(ALL);
  const [open, setOpen] = React.useState(false);

  const range = periodRange(period);
  const { data, isLoading, mutate } = useExpenses({
    ...range,
    category: category === ALL ? undefined : category,
    pageSize: 100,
  });

  async function remove(id: string) {
    if (!confirm('Usunąć wydatek?')) return;
    try {
      await apiRequest(`/api/expenses/${id}`, 'DELETE');
      toast.success('Usunięto');
      mutate();
      onChanged?.();
    } catch {
      toast.error('Błąd usuwania');
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as PeriodKey)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Wszystkie kategorie</SelectItem>
              {EXPENSE_CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Dodaj wydatek
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-md bg-muted px-4 py-2 text-sm">
        <span className="text-muted-foreground">Suma w okresie</span>
        <span className="text-lg font-bold">
          {formatCurrency(data?.sum ?? 0)}
        </span>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Kategoria</TableHead>
              <TableHead className="hidden md:table-cell">Opis</TableHead>
              <TableHead className="hidden sm:table-cell">Forma</TableHead>
              <TableHead className="text-right">Kwota</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
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
                  Brak wydatków w wybranym okresie.
                </TableCell>
              </TableRow>
            )}
            {items.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{formatDate(e.date)}</TableCell>
                <TableCell>
                  {EXPENSE_CATEGORY[e.category as ExpenseCategory]}
                </TableCell>
                <TableCell className="hidden max-w-[220px] truncate md:table-cell">
                  {e.description ?? '—'}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {e.paymentMethod
                    ? PAYMENT_METHOD[e.paymentMethod as PaymentMethod]
                    : '—'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(e.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {e.receiptPhoto && (
                      <a
                        href={e.receiptPhoto}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Paragon"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                      >
                        <Receipt className="h-4 w-4" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => remove(e.id)}
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

      <ExpenseFormDialog
        open={open}
        onOpenChange={setOpen}
        onSaved={() => {
          mutate();
          onChanged?.();
        }}
      />
    </div>
  );
}
