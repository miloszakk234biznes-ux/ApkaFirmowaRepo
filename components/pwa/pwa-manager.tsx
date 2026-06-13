/**
 * Plik: components/pwa/pwa-manager.tsx
 * Cel: Zarządza warstwą PWA po stronie klienta: wskaźnik online/offline z licznikiem
 *      rekordów oczekujących, automatyczne opróżnianie kolejki po odzyskaniu sieci
 *      oraz nasłuch komunikatu z Service Workera (Background Sync) do flushu.
 * Zależności: hooks/use-online, lib/offline/queue, sonner.
 * Użycie: montowany w layoutcie dashboardu.
 */
'use client';

import * as React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useOnline } from '@/hooks/use-online';
import { flushQueue, pendingCount } from '@/lib/offline/queue';
import { cn } from '@/lib/utils';

export function PwaManager() {
  const online = useOnline();
  const [pending, setPending] = React.useState(0);
  const [syncing, setSyncing] = React.useState(false);

  const refreshCount = React.useCallback(async () => {
    setPending(await pendingCount());
  }, []);

  const sync = React.useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const sent = await flushQueue();
      if (sent > 0) {
        toast.success(`Zsynchronizowano ${sent} rekordów`);
      }
    } finally {
      await refreshCount();
      setSyncing(false);
    }
  }, [syncing, refreshCount]);

  // Po odzyskaniu sieci — automatyczny flush.
  React.useEffect(() => {
    if (online) void sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // Licznik oczekujących — odświeżany cyklicznie i na zdarzenie kolejki.
  React.useEffect(() => {
    void refreshCount();
    const interval = setInterval(refreshCount, 5000);
    const onQueued = () => refreshCount();
    window.addEventListener('apka:queued', onQueued);
    // Komunikat z Service Workera (Background Sync).
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'APKA_SYNC') void sync();
    };
    navigator.serviceWorker?.addEventListener?.('message', onMessage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('apka:queued', onQueued);
      navigator.serviceWorker?.removeEventListener?.('message', onMessage);
    };
  }, [refreshCount, sync]);

  // Nie pokazujemy nic, gdy online i brak zaległości.
  if (online && pending === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-24 left-1/2 z-40 -translate-x-1/2 md:bottom-6',
        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg',
        online
          ? 'bg-background text-foreground'
          : 'border-amber-600 bg-amber-500 text-white',
      )}
    >
      {online ? (
        <Wifi className="h-3.5 w-3.5" />
      ) : (
        <WifiOff className="h-3.5 w-3.5" />
      )}
      {online ? 'Online' : 'Tryb offline'}
      {pending > 0 && (
        <button
          type="button"
          onClick={sync}
          className="flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5"
          disabled={!online || syncing}
        >
          <RefreshCw className={cn('h-3 w-3', syncing && 'animate-spin')} />
          {pending} do synchronizacji
        </button>
      )}
    </div>
  );
}
