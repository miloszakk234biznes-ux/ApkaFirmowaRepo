/**
 * Plik: components/documents/invoice-form.tsx
 * Cel: Formularz wystawienia faktury VAT / rachunku — nabywca (z autocomplete
 *      klienta), daty, pozycje (dynamiczne), podgląd PDF i zapis (numeracja).
 * Zależności: react-hook-form (useFieldArray), zod, components/*, lib/fetcher,
 *      lib/invoice-calc.
 */
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2, Eye, FileText } from 'lucide-react';
import {
  createInvoiceSchema,
  type CreateInvoiceInput,
} from '@/lib/validations/documents';
import { apiRequest } from '@/lib/fetcher';
import { computeInvoice } from '@/lib/invoice-calc';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClientCombobox } from '@/components/orders/client-combobox';
import type { ClientFull } from '@/types';

export function InvoiceForm({ onSaved }: { onSaved?: () => void }) {
  const [busy, setBusy] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      type: 'VAT',
      buyerName: '',
      items: [{ name: '', qty: 1, unitNet: 0, vatRate: 23 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const items = watch('items');
  const totals = computeInvoice(
    (items ?? []).map((i) => ({
      name: i.name || '',
      qty: Number(i.qty) || 0,
      unitNet: Number(i.unitNet) || 0,
      vatRate: Number(i.vatRate) || 0,
    })),
  );

  function fillFromClient(c: ClientFull | null) {
    if (!c) return;
    setValue('clientId', c.id);
    setValue('buyerName', `${c.firstName} ${c.lastName}`);
    if (c.address) setValue('buyerAddress', c.address);
  }

  async function preview() {
    const data = getValues();
    setBusy(true);
    try {
      const res = await fetch('/api/invoices/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Błąd podglądu');
      }
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd podglądu');
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(data: CreateInvoiceInput) {
    setBusy(true);
    try {
      const res = await apiRequest<{ invoice: { id: string; number: string } }>(
        '/api/invoices',
        'POST',
        data,
      );
      toast.success(`Wystawiono fakturę ${res.invoice.number}`);
      window.open(`/api/invoices/${res.invoice.id}/pdf`, '_blank');
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd wystawiania');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Wystaw fakturę / rachunek</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Typ dokumentu</Label>
              <Select
                defaultValue="VAT"
                onValueChange={(v) =>
                  setValue('type', v as CreateInvoiceInput['type'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VAT">Faktura VAT</SelectItem>
                  <SelectItem value="RECEIPT">Rachunek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Klient z bazy (opcjonalnie)</Label>
              <ClientCombobox value={null} onSelect={fillFromClient} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="buyerName">Nabywca *</Label>
              <Input id="buyerName" {...register('buyerName')} />
              {errors.buyerName && (
                <p className="text-sm text-destructive">
                  {errors.buyerName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyerNip">NIP nabywcy</Label>
              <Input id="buyerNip" {...register('buyerNip')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyerAddress">Adres nabywcy</Label>
              <Input id="buyerAddress" {...register('buyerAddress')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Data wystawienia</Label>
              <Input
                id="issueDate"
                type="date"
                {...register('issueDate', {
                  setValueAs: (v) =>
                    v ? new Date(v).toISOString() : undefined,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Termin płatności</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate', {
                  setValueAs: (v) =>
                    v ? new Date(v).toISOString() : undefined,
                })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="paymentMethod">Forma płatności</Label>
              <Input
                id="paymentMethod"
                placeholder="np. przelew 14 dni"
                {...register('paymentMethod')}
              />
            </div>
          </div>

          {/* Pozycje */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pozycje</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ name: '', qty: 1, unitNet: 0, vatRate: 23 })
                }
              >
                <Plus className="h-4 w-4" /> Pozycja
              </Button>
            </div>
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  {i === 0 && <Label className="text-xs">Nazwa</Label>}
                  <Input
                    placeholder="Nazwa usługi/towaru"
                    {...register(`items.${i}.name`)}
                  />
                </div>
                <div className="w-16 space-y-1">
                  {i === 0 && <Label className="text-xs">Ilość</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`items.${i}.qty`)}
                  />
                </div>
                <div className="w-24 space-y-1">
                  {i === 0 && <Label className="text-xs">Cena netto</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`items.${i}.unitNet`)}
                  />
                </div>
                <div className="w-20 space-y-1">
                  {i === 0 && <Label className="text-xs">VAT %</Label>}
                  <Input type="number" {...register(`items.${i}.vatRate`)} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => fields.length > 1 && remove(i)}
                  aria-label="Usuń pozycję"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {errors.items && (
              <p className="text-sm text-destructive">
                {errors.items.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Uwagi</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
          </div>

          {/* Podsumowanie */}
          <div className="flex flex-wrap items-center justify-end gap-4 rounded-md bg-muted p-3 text-sm">
            <span>Netto: {formatCurrency(totals.net)}</span>
            <span>VAT: {formatCurrency(totals.vat)}</span>
            <span className="text-base font-bold">
              Brutto: {formatCurrency(totals.gross)}
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={preview}
              disabled={busy}
            >
              <Eye className="h-4 w-4" /> Podgląd
            </Button>
            <Button type="submit" disabled={busy}>
              <FileText className="h-4 w-4" /> Wystaw fakturę
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
