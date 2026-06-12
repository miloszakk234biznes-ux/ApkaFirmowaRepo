/**
 * Plik: components/orders/order-sync-status.tsx
 * Cel: Wskaźnik statusu synchronizacji zlecenia z Google Calendar + przycisk
 *      ręcznej re-synchronizacji. Widoczny tylko gdy integracja skonfigurowana.
 * Zależności: lib/fetcher, components/ui/button, next/navigation.
 * Użycie: strona szczegółów zlecenia.
 */
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { GoogleSyncStatus } from '@prisma/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/fetcher';
import { cn } from '@/lib/utils';

interface OrderSyncStatusProps {
  orderId: string;
  status: GoogleSyncStatus;
  error: string | null;
  syncedAt: string | null;
}

const META: Record<
  GoogleSyncStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  NONE: {
    label: 'Brak synchronizacji',
    icon: Clock,
    className: 'text-muted-foreground',
  },
  PENDING: { label: 'Oczekuje', icon: Clock, className: 'text-amber-600' },
  SYNCED: {
    label: 'Zsynchronizowane',
    icon: CheckCircle2,
    className: 'text-status-done',
  },
  ERROR: {
    label: 'Błąd synchronizacji',
    icon: AlertCircle,
    className: 'text-destructive',
  },
};

export function OrderSyncStatus({
  orderId,
  status,
  error,
  syncedAt,
}: OrderSyncStatusProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const meta = META[status];
  const Icon = meta.icon;

  async function resync() {
    setBusy(true);
    try {
      await apiRequest('/api/google-calendar/resync', 'POST', { orderId });
      toast.success('Zsynchronizowano z Google Calendar');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd synchronizacji');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-3">
      <div className="flex items-center gap-2 text-sm">
        <Icon className={cn('h-4 w-4', meta.className)} />
        <div>
          <p className={cn('font-medium', meta.className)}>{meta.label}</p>
          {status === 'ERROR' && error && (
            <p className="text-xs text-muted-foreground">{error}</p>
          )}
          {status === 'SYNCED' && syncedAt && (
            <p className="text-xs text-muted-foreground">
              {new Date(syncedAt).toLocaleString('pl-PL')}
            </p>
          )}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={resync} disabled={busy}>
        <RefreshCw className={cn('h-4 w-4', busy && 'animate-spin')} />
        Synchronizuj
      </Button>
    </div>
  );
}
