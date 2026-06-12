/**
 * Plik: components/orders/order-form.tsx
 * Cel: Pełny formularz zlecenia (tworzenie i edycja) ze wszystkimi polami ze
 *      specyfikacji: klient (autocomplete lub nowy), termin, czas trwania (suwak),
 *      typ usługi, opis, kwoty (pozostała auto), płatność, przypisany pracownik,
 *      priorytet, status, cykliczność, notatki.
 * Zależności: react-hook-form, zod, components/ui/*, components/orders/client-combobox,
 *      hooks/use-users, lib/fetcher, lib/constants.
 * Użycie: order-form-dialog (modal) oraz strony /orders/new i /orders/[id]/edit.
 */
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Role } from '@prisma/client';
import { createOrderSchema } from '@/lib/validations/order';
import type { z } from 'zod';
import { apiRequest } from '@/lib/fetcher';
import { useUsers } from '@/hooks/use-users';
import { ClientCombobox } from '@/components/orders/client-combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ORDER_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  SERVICE_TYPES,
} from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import type { ClientFull, OrderDetail } from '@/types';

type FormValues = z.input<typeof createOrderSchema>;

interface OrderFormProps {
  /** Rola bieżącego użytkownika — pracownik nie wybiera przypisania. */
  role: Role;
  /** Zlecenie do edycji (brak → tryb tworzenia). */
  order?: OrderDetail | null;
  /** Domyślny termin (np. z kliknięcia w kalendarz) — ISO local. */
  defaultScheduledAt?: string;
  onSuccess?: (orderId: string) => void;
  onCancel?: () => void;
}

/** Konwersja ISO (UTC) → wartość dla input[type=datetime-local] (czas lokalny). */
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

/** Konwersja wartości datetime-local → ISO z offsetem. */
function localInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export function OrderForm({
  role,
  order,
  defaultScheduledAt,
  onSuccess,
  onCancel,
}: OrderFormProps) {
  const isAdmin = role === Role.ADMIN;
  const { users } = useUsers(isAdmin);
  const isEdit = !!order;

  const [selectedClient, setSelectedClient] = React.useState<ClientFull | null>(
    order?.client
      ? {
          id: order.client.id,
          firstName: order.client.firstName,
          lastName: order.client.lastName,
          phone: order.client.phone,
          email: order.client.email ?? null,
          address: order.client.address ?? null,
          city: null,
          notes: null,
        }
      : null,
  );
  const [duration, setDuration] = React.useState<number>(
    order?.estimatedDuration ?? 60,
  );
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      title: order?.title ?? '',
      clientId: order?.clientId ?? undefined,
      assignedUserId: order?.assignedUserId ?? undefined,
      serviceType: order?.serviceType ?? undefined,
      description: order?.description ?? undefined,
      address: order?.address ?? selectedClient?.address ?? undefined,
      scheduledAt:
        isoToLocalInput(order?.scheduledAt) || defaultScheduledAt || '',
      status: order?.status ?? 'NEW',
      priority: order?.priority ?? 'NORMAL',
      amount: order ? Number(order.amount) : 0,
      deposit: order ? Number(order.deposit) : 0,
      paymentMethod: order?.paymentMethod ?? undefined,
      paymentStatus: order?.paymentStatus ?? 'UNPAID',
      isRecurring: order?.isRecurring ?? false,
      recurringRule: order?.recurringRule ?? undefined,
      notes: order?.notes ?? undefined,
    },
  });

  const amount = Number(watch('amount')) || 0;
  const deposit = Number(watch('deposit')) || 0;
  const remaining = Math.max(0, amount - deposit);
  const isRecurring = watch('isRecurring');

  // Synchronizacja wyboru klienta z polami formularza.
  React.useEffect(() => {
    if (selectedClient) {
      setValue('clientId', selectedClient.id);
      setValue('clientFirstName', undefined);
      setValue('clientLastName', undefined);
      setValue('clientPhone', undefined);
      if (selectedClient.address) setValue('address', selectedClient.address);
    } else {
      setValue('clientId', undefined);
    }
  }, [selectedClient, setValue]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        estimatedDuration: duration,
        scheduledAt: values.scheduledAt
          ? localInputToIso(String(values.scheduledAt))
          : undefined,
      };
      const res = isEdit
        ? await apiRequest<{ order: { id: string } }>(
            `/api/orders/${order!.id}`,
            'PATCH',
            payload,
          )
        : await apiRequest<{ order: { id: string } }>(
            '/api/orders',
            'POST',
            payload,
          );
      toast.success(isEdit ? 'Zlecenie zaktualizowane' : 'Zlecenie utworzone');
      onSuccess?.(res.order.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Wystąpił błąd');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Tytuł */}
      <div className="space-y-2">
        <Label htmlFor="title">Tytuł zlecenia *</Label>
        <Input
          id="title"
          placeholder="np. Sprzątanie biura"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Klient */}
      <div className="space-y-2">
        <Label>Klient</Label>
        <ClientCombobox value={selectedClient} onSelect={setSelectedClient} />
      </div>

      {/* Dane nowego klienta — tylko gdy nie wybrano istniejącego */}
      {!selectedClient && (
        <div className="grid grid-cols-1 gap-3 rounded-md border border-dashed p-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="clientFirstName">Imię klienta</Label>
            <Input id="clientFirstName" {...register('clientFirstName')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientLastName">Nazwisko klienta</Label>
            <Input id="clientLastName" {...register('clientLastName')} />
            {errors.clientLastName && (
              <p className="text-sm text-destructive">
                {errors.clientLastName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientPhone">Telefon</Label>
            <Input id="clientPhone" type="tel" {...register('clientPhone')} />
          </div>
        </div>
      )}

      {/* Adres */}
      <div className="space-y-2">
        <Label htmlFor="address">Adres realizacji</Label>
        <Input id="address" {...register('address')} />
      </div>

      {/* Termin + czas trwania */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduledAt">Termin</Label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            {...register('scheduledAt')}
          />
        </div>
        <div className="space-y-2">
          <Label>
            Czas trwania: <span className="font-semibold">{duration} min</span>
          </Label>
          <Slider
            value={[duration]}
            min={0}
            max={480}
            step={15}
            onValueChange={(v) => setDuration(v[0] ?? 0)}
            className="py-3"
          />
        </div>
      </div>

      {/* Typ usługi + priorytet */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Typ usługi</Label>
          <Select
            defaultValue={order?.serviceType ?? undefined}
            onValueChange={(v) => setValue('serviceType', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz typ" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priorytet</Label>
          <Select
            defaultValue={order?.priority ?? 'NORMAL'}
            onValueChange={(v) =>
              setValue('priority', v as FormValues['priority'])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Opis */}
      <div className="space-y-2">
        <Label htmlFor="description">Opis</Label>
        <Textarea id="description" rows={3} {...register('description')} />
      </div>

      {/* Kwoty */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Kwota brutto (zł)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            {...register('amount')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deposit">Zaliczka (zł)</Label>
          <Input
            id="deposit"
            type="number"
            step="0.01"
            min="0"
            {...register('deposit')}
          />
        </div>
        <div className="space-y-2">
          <Label>Pozostało</Label>
          <div className="flex h-11 items-center rounded-md border bg-muted px-3 text-sm font-medium">
            {formatCurrency(remaining)}
          </div>
        </div>
      </div>

      {/* Płatność */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Forma płatności</Label>
          <Select
            defaultValue={order?.paymentMethod ?? undefined}
            onValueChange={(v) =>
              setValue('paymentMethod', v as FormValues['paymentMethod'])
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
          <Label>Status płatności</Label>
          <Select
            defaultValue={order?.paymentStatus ?? 'UNPAID'}
            onValueChange={(v) =>
              setValue('paymentStatus', v as FormValues['paymentStatus'])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status + przypisany pracownik (admin) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            defaultValue={order?.status ?? 'NEW'}
            onValueChange={(v) => setValue('status', v as FormValues['status'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <div className="space-y-2">
            <Label>Przypisany pracownik</Label>
            <Select
              defaultValue={order?.assignedUserId ?? undefined}
              onValueChange={(v) => setValue('assignedUserId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nieprzypisane" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Cykliczność */}
      <div className="space-y-2 rounded-md border p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="h-4 w-4"
            {...register('isRecurring')}
          />
          Zlecenie cykliczne
        </label>
        {isRecurring && (
          <div className="space-y-2">
            <Label htmlFor="recurringRule">Reguła RRULE (iCalendar)</Label>
            <Input
              id="recurringRule"
              placeholder="np. FREQ=WEEKLY;BYDAY=MO"
              {...register('recurringRule')}
            />
          </div>
        )}
      </div>

      {/* Notatki */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notatki</Label>
        <Textarea id="notes" rows={2} {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Anuluj
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting
            ? 'Zapisywanie…'
            : isEdit
              ? 'Zapisz zmiany'
              : 'Utwórz zlecenie'}
        </Button>
      </div>
    </form>
  );
}
