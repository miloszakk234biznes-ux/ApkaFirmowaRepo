/**
 * Plik: components/finances/expense-form-dialog.tsx
 * Cel: Modal dodawania wydatku — kwota, kategoria (18), data, opis, forma
 *      płatności oraz upload zdjęcia paragonu (do /api/uploads).
 * Zależności: react-hook-form, zod, components/ui/*, lib/fetcher, lib/constants.
 */
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Upload, Check, Loader2 } from 'lucide-react';
import {
  createExpenseSchema,
  type CreateExpenseInput,
} from '@/lib/validations/finance';
import { submitWithOfflineFallback } from '@/lib/offline/queue';
import {
  EXPENSE_CATEGORY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

function todayLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [receiptUrl, setReceiptUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
  });

  React.useEffect(() => {
    if (open) {
      reset({ amount: 0, category: undefined });
      setReceiptUrl(null);
    }
  }, [open, reset]);

  async function uploadReceipt(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/uploads', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Błąd uploadu');
      setReceiptUrl(json.url);
      toast.success('Paragon dodany');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd uploadu');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: CreateExpenseInput) {
    setSubmitting(true);
    try {
      const res = await submitWithOfflineFallback('expense', '/api/expenses', {
        ...data,
        date: data.date ? new Date(data.date).toISOString() : undefined,
        receiptPhoto: receiptUrl ?? undefined,
      });
      if (res.offline) {
        toast.success('Zapisano offline — wyśle się po połączeniu');
        window.dispatchEvent(new Event('apka:queued'));
      } else {
        toast.success('Wydatek dodany');
      }
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd zapisu');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowy wydatek</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Kwota (zł) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount')}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                defaultValue={todayLocal()}
                {...register('date', {
                  setValueAs: (v) =>
                    v ? new Date(v).toISOString() : undefined,
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kategoria *</Label>
            <Select
              onValueChange={(v) =>
                setValue('category', v as CreateExpenseInput['category'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">Wybierz kategorię</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Forma płatności</Label>
            <Select
              onValueChange={(v) =>
                setValue(
                  'paymentMethod',
                  v as CreateExpenseInput['paymentMethod'],
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea id="description" rows={2} {...register('description')} />
          </div>

          <div className="space-y-2">
            <Label>Zdjęcie paragonu</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : receiptUrl ? (
                <Check className="h-4 w-4 text-status-done" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {receiptUrl ? 'Paragon dodany' : 'Dodaj zdjęcie paragonu'}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && uploadReceipt(e.target.files[0])
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Zapisywanie…' : 'Dodaj wydatek'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
