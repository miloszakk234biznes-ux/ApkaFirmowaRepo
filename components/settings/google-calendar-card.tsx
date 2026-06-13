/**
 * Plik: components/settings/google-calendar-card.tsx
 * Cel: Karta ustawień integracji Google Calendar — połącz/rozłącz konto, wybór
 *      kalendarza docelowego, włączenie powiadomień push (dwukierunkowa synchr.).
 *      Reaguje na ?google=connected|denied|error w URL po powrocie z OAuth.
 * Zależności: swr, lib/fetcher, components/ui/*.
 * Użycie: app/(dashboard)/settings/page.tsx.
 */
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import { CalendarCheck, Link2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetcher, apiRequest } from '@/lib/fetcher';

interface GoogleStatus {
  configured: boolean;
  connected: boolean;
  email: string | null;
  calendarId: string | null;
  pushEnabled: boolean;
  pushExpiration: string | null;
}

interface CalendarItem {
  id: string;
  summary: string;
  primary: boolean;
}

export function GoogleCalendarCard() {
  const params = useSearchParams();
  const { data: status, mutate } = useSWR<GoogleStatus>(
    '/api/google-calendar/status',
    fetcher,
  );
  const { data: calData } = useSWR<{ calendars: CalendarItem[] }>(
    status?.connected ? '/api/google-calendar/calendars' : null,
    fetcher,
  );
  const [busy, setBusy] = React.useState(false);

  // Komunikaty po powrocie z OAuth.
  React.useEffect(() => {
    const g = params.get('google');
    if (g === 'connected') toast.success('Połączono z Google Calendar');
    else if (g === 'denied') toast.error('Odmówiono dostępu do Google');
    else if (g === 'error') toast.error('Błąd łączenia z Google');
  }, [params]);

  async function selectCalendar(calendarId: string) {
    setBusy(true);
    try {
      await apiRequest('/api/google-calendar/select', 'POST', { calendarId });
      toast.success('Zapisano kalendarz docelowy');
      mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd');
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!confirm('Rozłączyć konto Google Calendar?')) return;
    setBusy(true);
    try {
      await apiRequest('/api/google-calendar/disconnect', 'POST');
      toast.success('Rozłączono');
      mutate();
    } catch {
      toast.error('Nie udało się rozłączyć');
    } finally {
      setBusy(false);
    }
  }

  async function togglePush() {
    setBusy(true);
    try {
      if (status?.pushEnabled) {
        await apiRequest('/api/google-calendar/watch', 'DELETE');
        toast.success('Wyłączono powiadomienia push');
      } else {
        await apiRequest('/api/google-calendar/watch', 'POST');
        toast.success('Włączono synchronizację dwukierunkową');
      }
      mutate();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : 'Błąd konfiguracji push (wymaga HTTPS)',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5" /> Google Calendar
        </CardTitle>
        <CardDescription>
          Automatyczna synchronizacja zleceń z Twoim kalendarzem Google.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status.configured && (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Integracja nie jest skonfigurowana na serwerze. Ustaw zmienne
            <code className="mx-1">GOOGLE_CLIENT_ID</code> i
            <code className="mx-1">GOOGLE_CLIENT_SECRET</code> (instrukcja w
            <code className="mx-1">docs/GOOGLE_CALENDAR.md</code>).
          </p>
        )}

        {status.configured && !status.connected && (
          <Button asChild disabled={busy}>
            <a href="/api/google-calendar/connect">
              <Link2 className="h-4 w-4" /> Połącz konto Google
            </a>
          </Button>
        )}

        {status.connected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 rounded-md border p-3">
              <div className="text-sm">
                <p className="font-medium">Połączono</p>
                <p className="text-muted-foreground">{status.email ?? '—'}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                disabled={busy}
              >
                Rozłącz
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kalendarz docelowy</label>
              <Select
                value={status.calendarId ?? undefined}
                onValueChange={selectCalendar}
                disabled={busy || !calData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz kalendarz" />
                </SelectTrigger>
                <SelectContent>
                  {(calData?.calendars ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.summary}
                      {c.primary ? ' (główny)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-md border p-3">
              <div className="text-sm">
                <p className="font-medium">Synchronizacja dwukierunkowa</p>
                <p className="text-muted-foreground">
                  {status.pushEnabled
                    ? 'Włączona — zmiany z Google wracają do aplikacji'
                    : 'Wyłączona (wymaga publicznego HTTPS)'}
                </p>
              </div>
              <Button
                variant={status.pushEnabled ? 'outline' : 'default'}
                size="sm"
                onClick={togglePush}
                disabled={busy}
              >
                <RefreshCw className="h-4 w-4" />
                {status.pushEnabled ? 'Wyłącz' : 'Włącz'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
