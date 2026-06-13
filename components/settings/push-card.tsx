/**
 * Plik: components/settings/push-card.tsx
 * Cel: Włączenie/wyłączenie powiadomień push (Web Push) — prosi o zgodę, tworzy
 *      subskrypcję przez Service Worker i zapisuje ją na serwerze. Gated kluczem
 *      VAPID (status z /api/notifications/subscribe).
 * Zależności: swr, lib/fetcher, components/ui/*.
 */
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { BellRing, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { fetcher } from '@/lib/fetcher';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushCard() {
  const { data } = useSWR<{ configured: boolean; publicKey: string | null }>(
    '/api/notifications/subscribe',
    fetcher,
  );
  const [subscribed, setSubscribed] = React.useState<boolean | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      setSubscribed(false);
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSubscribed(false));
  }, []);

  async function enable() {
    if (!data?.publicKey) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Brak zgody na powiadomienia');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          data.publicKey,
        ) as BufferSource,
      });
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error('Błąd zapisu subskrypcji');
      setSubscribed(true);
      toast.success('Powiadomienia push włączone');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Nie udało się włączyć');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(
          `/api/notifications/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`,
          { method: 'DELETE' },
        );
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success('Powiadomienia push wyłączone');
    } catch {
      toast.error('Błąd');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" /> Powiadomienia push
        </CardTitle>
        <CardDescription>
          Otrzymuj przypomnienia o zleceniach nawet przy zamkniętej aplikacji.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!data?.configured ? (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Push nie jest skonfigurowany na serwerze (brak kluczy VAPID).
            Wygeneruj: <code>npx web-push generate-vapid-keys</code> i ustaw
            <code className="mx-1">VAPID_PUBLIC_KEY</code> /
            <code className="mx-1">VAPID_PRIVATE_KEY</code>.
          </p>
        ) : subscribed ? (
          <Button variant="outline" onClick={disable} disabled={busy}>
            <BellOff className="h-4 w-4" /> Wyłącz powiadomienia
          </Button>
        ) : (
          <Button onClick={enable} disabled={busy}>
            <BellRing className="h-4 w-4" /> Włącz powiadomienia
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
