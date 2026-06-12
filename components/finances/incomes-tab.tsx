/**
 * Plik: components/finances/incomes-tab.tsx
 * Cel: Tabela przychodów z filtrem okresu, sumą, oznaczeniem źródła (auto/manual),
 *      usuwaniem (poza automatycznymi) i dodawaniem (modal).
 * Zależności: hooks/use-finance, components/finances/income-form-dialog, ui/*.
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useIncomes } from '@/hooks/use-finance';
import { apiRequest } from '@/lib/fetcher';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PERIOD_OPTIONS, periodRange, type PeriodKey } from '@/lib/periods';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { IncomeFormDialog } from '@/components/finances/income-form-dialog';

export function IncomesTab({ onChanged }: { onChanged?: () => void }) {
  const [period, setPeriod] = React.useState<PeriodKey>('month');
  const [open, setOpen] = React.useState(false);
  const range = periodRange(period);
  const { data, isLoading, mutate } = useIncomes({ ...range, pageSize: 100 });

  async function remove(id: string) {
    if (!confirm('Usunąć przychód?')) return;
    try {
      await apiRequest(`/api/incomes/${id}`, 'DELETE');
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
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
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
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Dodaj przychód
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
              <TableHead>Opis / źródło</TableHead>
              <TableHead className="text-right">Kwota</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  Brak przychodów w wybranym okresie.
                </TableCell>
              </TableRow>
            )}
            {items.map((inc) => {
              const isAuto = inc.source === 'AUTO_ORDER';
              return (
                <TableRow key={inc.id}>
                  <TableCell>{formatDate(inc.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="truncate">
                        {inc.order ? (
                          <Link
                            href={`/orders/${inc.order.id}`}
                            className="hover:underline"
                          >
                            {inc.description ?? inc.order.title}
                          </Link>
                        ) : (
                          (inc.description ?? inc.source ?? '—')
                        )}
                      </span>
                      {isAuto && (
                        <Badge variant="secondary" className="shrink-0">
                          auto
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(inc.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {!isAuto && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => remove(inc.id)}
                        aria-label="Usuń"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <IncomeFormDialog
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
