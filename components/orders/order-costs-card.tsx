/**
 * Plik: components/orders/order-costs-card.tsx
 * Cel: Rentowność zlecenia (ADMIN) — lista kosztów realizacji, formularz dodania,
 *      wyliczenia: brutto − koszty = zysk netto oraz % rentowności.
 * Zależności: swr, lib/fetcher, components/ui/*, lib/utils.
 * Użycie: strona szczegółów zlecenia (sekcja widoczna tylko dla admina).
 */
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetcher, apiRequest } from '@/lib/fetcher';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Profitability } from '@/types';

export function OrderCostsCard({ orderId }: { orderId: string }) {
  const endpoint = `/api/orders/${orderId}/costs`;
  const { data, mutate } = useSWR<Profitability>(endpoint, fetcher);
  const [category, setCategory] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [adding, setAdding] = React.useState(false);

  async function add() {
    if (!category.trim() || !amount) {
      toast.error('Podaj kategorię i kwotę');
      return;
    }
    setAdding(true);
    try {
      await apiRequest(endpoint, 'POST', {
        category: category.trim(),
        amount: Number(amount),
      });
      setCategory('');
      setAmount('');
      mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd');
    } finally {
      setAdding(false);
    }
  }

  async function remove(costId: string) {
    try {
      await apiRequest(`${endpoint}/${costId}`, 'DELETE');
      mutate();
    } catch {
      toast.error('Błąd usuwania');
    }
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Wyliczenia */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md border p-2">
          <p className="text-xs text-muted-foreground">Brutto</p>
          <p className="font-semibold">{formatCurrency(data.gross)}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs text-muted-foreground">Koszty</p>
          <p className="font-semibold">{formatCurrency(data.costs)}</p>
        </div>
        <div className="rounded-md border p-2">
          <p className="text-xs text-muted-foreground">
            Zysk ({data.marginPct.toFixed(0)}%)
          </p>
          <p
            className={`font-semibold ${data.profit >= 0 ? 'text-status-done' : 'text-destructive'}`}
          >
            {formatCurrency(data.profit)}
          </p>
        </div>
      </div>

      {/* Lista kosztów */}
      {data.items.length > 0 && (
        <ul className="space-y-1.5">
          {data.items.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-md border p-2 text-sm"
            >
              <span>
                {c.category}
                {c.description ? (
                  <span className="text-muted-foreground">
                    {' '}
                    · {c.description}
                  </span>
                ) : null}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-medium">{formatCurrency(c.amount)}</span>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label="Usuń koszt"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Dodawanie kosztu */}
      <div className="flex gap-2">
        <Input
          placeholder="Kategoria (np. paliwo, materiały)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Input
          type="number"
          step="0.01"
          placeholder="Kwota"
          className="w-32"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button type="button" onClick={add} disabled={adding}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
