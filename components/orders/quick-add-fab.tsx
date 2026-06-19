/**
 * Plik: components/orders/quick-add-fab.tsx
 * Cel: Pływający przycisk (FAB) „+” — menu szybkiego dodawania. Dla admina daje
 *      wybór: zlecenie / przychód / wydatek; dla pozostałych otwiera od razu
 *      3-krokowy formularz zlecenia (klient → termin → kwota, < 10 sek.).
 *      Dostępny z każdego ekranu (montowany w layout dashboardu).
 * Zależności: components/ui/{dialog,button,input,label,slider,dropdown-menu},
 *      client-combobox, finances/{income,expense}-form-dialog, lib/fetcher.
 */
'use client';

import * as React from 'react';
import { Plus, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ClientCombobox } from '@/components/orders/client-combobox';
import { IncomeFormDialog } from '@/components/finances/income-form-dialog';
import { ExpenseFormDialog } from '@/components/finances/expense-form-dialog';
import { apiRequest } from '@/lib/fetcher';
import { cn, formatCurrency } from '@/lib/utils';
import type { ClientFull } from '@/types';

export function QuickAddFab({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [incomeOpen, setIncomeOpen] = React.useState(false);
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  // Stan formularza
  const [client, setClient] = React.useState<ClientFull | null>(null);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [scheduledAt, setScheduledAt] = React.useState('');
  const [duration, setDuration] = React.useState(60);
  const [amount, setAmount] = React.useState('');
  const [deposit, setDeposit] = React.useState('');

  function reset() {
    setStep(0);
    setClient(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setTitle('');
    setScheduledAt('');
    setDuration(60);
    setAmount('');
    setDeposit('');
  }

  const canNext =
    step === 0
      ? !!client || (!!firstName && !!lastName)
      : step === 1
        ? !!title
        : true;

  async function submit() {
    setSubmitting(true);
    try {
      const payload = {
        title: title || 'Szybkie zlecenie',
        clientId: client?.id,
        clientFirstName: client ? undefined : firstName,
        clientLastName: client ? undefined : lastName,
        clientPhone: client ? undefined : phone,
        scheduledAt: scheduledAt
          ? new Date(scheduledAt).toISOString()
          : undefined,
        estimatedDuration: duration,
        amount: Number(amount) || 0,
        deposit: Number(deposit) || 0,
        status: 'NEW',
      };
      const res = await apiRequest<{ order: { id: string } }>(
        '/api/orders',
        'POST',
        payload,
      );
      toast.success('Zlecenie dodane');
      setOpen(false);
      reset();
      router.push(`/orders/${res.order.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Nie udało się dodać');
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = Math.max(0, (Number(amount) || 0) - (Number(deposit) || 0));
  const steps = ['Klient', 'Termin', 'Kwota'];

  const fabClass =
    'fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:bottom-6 md:right-6';

  return (
    <>
      {isAdmin ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" aria-label="Dodaj" className={fabClass}>
              <Plus className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuItem onSelect={() => setOpen(true)}>
              <FileText className="mr-2 h-4 w-4" /> Dodaj zlecenie
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIncomeOpen(true)}>
              <TrendingUp className="mr-2 h-4 w-4" /> Dodaj przychód
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setExpenseOpen(true)}>
              <TrendingDown className="mr-2 h-4 w-4" /> Dodaj wydatek
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          size="icon"
          aria-label="Szybkie zlecenie"
          onClick={() => setOpen(true)}
          className={fabClass}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Dodawanie przychodu / wydatku (z kategorią) — jak na komputerze. */}
      <IncomeFormDialog
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        onSaved={() => router.refresh()}
      />
      <ExpenseFormDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        onSaved={() => router.refresh()}
      />

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Szybkie zlecenie</DialogTitle>
            <DialogDescription>
              Krok {step + 1} z 3 — {steps[step]}
            </DialogDescription>
          </DialogHeader>

          {/* Wskaźnik kroków */}
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  i <= step ? 'bg-primary' : 'bg-muted',
                )}
              />
            ))}
          </div>

          {/* Krok 1 — klient */}
          {step === 0 && (
            <div className="space-y-3">
              <ClientCombobox value={client} onSelect={setClient} />
              {!client && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Imię</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nazwisko</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Telefon</Label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Krok 2 — termin */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Tytuł zlecenia *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="np. Serwis klimatyzacji"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Termin</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Czas trwania: {duration} min</Label>
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
          )}

          {/* Krok 3 — kwota */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Kwota brutto (zł)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Zaliczka (zł)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                  />
                </div>
              </div>
              <div className="rounded-md bg-muted p-3 text-sm">
                Pozostało do zapłaty:{' '}
                <span className="font-semibold">
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => (step === 0 ? setOpen(false) : setStep(step - 1))}
            >
              {step === 0 ? 'Anuluj' : 'Wstecz'}
            </Button>
            {step < 2 ? (
              <Button
                type="button"
                disabled={!canNext}
                onClick={() => setStep(step + 1)}
              >
                Dalej
              </Button>
            ) : (
              <Button type="button" disabled={submitting} onClick={submit}>
                {submitting ? 'Dodawanie…' : 'Dodaj zlecenie'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
