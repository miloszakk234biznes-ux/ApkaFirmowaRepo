/**
 * Plik: components/finances/income-form-dialog.tsx
 * Cel: Modal ręcznego dodawania przychodu (kwota, data, źródło, opis).
 * Zależności: react-hook-form, zod, components/ui/*, lib/fetcher.
 */
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  createIncomeSchema,
  type CreateIncomeInput,
} from '@/lib/validations/finance';
import { apiRequest } from '@/lib/fetcher';
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

function todayLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function IncomeFormDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: () => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateIncomeInput>({ resolver: zodResolver(createIncomeSchema) });

  React.useEffect(() => {
    if (open) reset({ amount: 0 });
  }, [open, reset]);

  async function onSubmit(data: CreateIncomeInput) {
    setSubmitting(true);
    try {
      await apiRequest('/api/incomes', 'POST', {
        ...data,
        date: data.date ? new Date(data.date).toISOString() : undefined,
      });
      toast.success('Przychód dodany');
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
          <DialogTitle>Nowy przychód</DialogTitle>
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
            <Label htmlFor="source">Źródło</Label>
            <Input
              id="source"
              placeholder="np. sprzedaż, napiwek"
              {...register('source')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea id="description" rows={2} {...register('description')} />
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
              {submitting ? 'Zapisywanie…' : 'Dodaj przychód'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
