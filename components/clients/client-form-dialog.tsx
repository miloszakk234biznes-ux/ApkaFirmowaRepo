/**
 * Plik: components/clients/client-form-dialog.tsx
 * Cel: Modal tworzenia/edycji klienta z walidacją Zod i detekcją duplikatu po
 *      numerze telefonu (ostrzeżenie przed zapisem nowego klienta).
 * Zależności: react-hook-form, zod, components/ui/*, lib/fetcher.
 */
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import {
  createClientSchema,
  type CreateClientInput,
} from '@/lib/validations/client';
import { apiRequest, fetcher } from '@/lib/fetcher';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ClientFull } from '@/types';

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Klient do edycji (brak → tworzenie). */
  client?: ClientFull | null;
  onSaved?: (clientId: string) => void;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSaved,
}: ClientFormDialogProps) {
  const isEdit = !!client;
  const [submitting, setSubmitting] = React.useState(false);
  const [duplicate, setDuplicate] = React.useState<{
    id: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
  });

  // Wypełnij formularz przy edycji / wyczyść przy tworzeniu.
  React.useEffect(() => {
    if (open) {
      reset({
        firstName: client?.firstName ?? '',
        lastName: client?.lastName ?? '',
        phone: client?.phone ?? '',
        email: client?.email ?? '',
        address: client?.address ?? '',
        city: client?.city ?? '',
        notes: client?.notes ?? '',
      });
      setDuplicate(null);
    }
  }, [open, client, reset]);

  const phone = watch('phone');

  // Detekcja duplikatu po telefonie (tylko przy tworzeniu).
  React.useEffect(() => {
    if (isEdit || !phone || phone.trim().length < 6) {
      setDuplicate(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetcher<{ duplicate: typeof duplicate }>(
          `/api/clients/check?phone=${encodeURIComponent(phone.trim())}`,
        );
        setDuplicate(res.duplicate);
      } catch {
        setDuplicate(null);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [phone, isEdit]);

  async function onSubmit(data: CreateClientInput) {
    setSubmitting(true);
    try {
      const res = isEdit
        ? await apiRequest<{ client: { id: string } }>(
            `/api/clients/${client!.id}`,
            'PATCH',
            data,
          )
        : await apiRequest<{ client: { id: string }; duplicate?: boolean }>(
            '/api/clients',
            'POST',
            data,
          );
      toast.success(isEdit ? 'Zapisano zmiany' : 'Dodano klienta');
      onOpenChange(false);
      onSaved?.(res.client.id);
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
          <DialogTitle>{isEdit ? 'Edytuj klienta' : 'Nowy klient'}</DialogTitle>
          <DialogDescription>
            Pola imię i nazwisko są wymagane.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">Imię *</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nazwisko *</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" type="tel" {...register('phone')} />
            {duplicate && (
              <p className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Klient z tym numerem już istnieje: {duplicate.firstName}{' '}
                {duplicate.lastName}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">Miasto</Label>
              <Input id="city" {...register('city')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adres</Label>
              <Input id="address" {...register('address')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notatki</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
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
              {submitting ? 'Zapisywanie…' : isEdit ? 'Zapisz' : 'Dodaj'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
