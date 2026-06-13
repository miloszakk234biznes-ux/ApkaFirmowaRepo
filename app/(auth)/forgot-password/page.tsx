/**
 * Plik: app/(auth)/forgot-password/page.tsx
 * Cel: Formularz prośby o reset hasła — wysyła e-mail z linkiem.
 * Zależności: react-hook-form, @hookform/resolvers, sonner.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Wystąpił błąd');
        return;
      }
      setSent(true);
      toast.success('Sprawdź skrzynkę e-mail');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Reset hasła</CardTitle>
        <CardDescription>
          Podaj adres e-mail, a wyślemy Ci link do ustawienia nowego hasła.
        </CardDescription>
      </CardHeader>
      {sent ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Jeśli konto istnieje, na podany adres wysłaliśmy wiadomość z linkiem
            do resetu hasła. Link jest ważny przez 60 minut.
          </p>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Wysyłanie…' : 'Wyślij link resetujący'}
            </Button>
          </CardFooter>
        </form>
      )}
      <CardFooter>
        <Link
          href="/login"
          className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Powrót do logowania
        </Link>
      </CardFooter>
    </Card>
  );
}
