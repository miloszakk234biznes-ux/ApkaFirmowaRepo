/**
 * Plik: components/documents/company-form.tsx
 * Cel: Formularz danych firmy (sprzedawca) używanych na fakturach. ADMIN.
 * Zależności: swr, react-hook-form, zod, components/ui/*, lib/fetcher.
 */
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  companySettingsSchema,
  type CompanySettingsInput,
} from '@/lib/validations/documents';
import { fetcher, apiRequest } from '@/lib/fetcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CompanyForm() {
  const { data, mutate } = useSWR<{ company: CompanySettingsInput | null }>(
    '/api/company',
    fetcher,
  );
  const [saving, setSaving] = React.useState(false);
  const { register, handleSubmit, reset } = useForm<CompanySettingsInput>({
    resolver: zodResolver(companySettingsSchema),
  });

  React.useEffect(() => {
    if (data?.company) reset(data.company);
  }, [data, reset]);

  async function onSubmit(values: CompanySettingsInput) {
    setSaving(true);
    try {
      await apiRequest('/api/company', 'PUT', values);
      toast.success('Zapisano dane firmy');
      mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd zapisu');
    } finally {
      setSaving(false);
    }
  }

  const fields: { name: keyof CompanySettingsInput; label: string }[] = [
    { name: 'name', label: 'Nazwa firmy' },
    { name: 'nip', label: 'NIP' },
    { name: 'address', label: 'Adres' },
    { name: 'postalCode', label: 'Kod pocztowy' },
    { name: 'city', label: 'Miasto' },
    { name: 'email', label: 'E-mail' },
    { name: 'phone', label: 'Telefon' },
    { name: 'bankAccount', label: 'Numer konta' },
    { name: 'invoicePrefix', label: 'Prefiks faktur (np. FV)' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dane firmy (do faktur)</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {fields.map((f) => (
            <div key={f.name} className="space-y-2">
              <Label htmlFor={f.name}>{f.label}</Label>
              <Input id={f.name} {...register(f.name)} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Zapisywanie…' : 'Zapisz dane firmy'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
