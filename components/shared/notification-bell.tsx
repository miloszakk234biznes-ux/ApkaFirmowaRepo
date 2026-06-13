/**
 * Plik: components/shared/notification-bell.tsx
 * Cel: Centrum powiadomień w nagłówku — ikona dzwonka z licznikiem nieprzeczytanych,
 *      lista ostatnich powiadomień, oznaczanie wszystkich jako przeczytane.
 *      Odświeża licznik co 60 s.
 * Zależności: swr, lib/fetcher, components/ui/dropdown-menu, lucide-react.
 * Użycie: nagłówek app/(dashboard)/layout.tsx.
 */
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Bell } from 'lucide-react';
import { fetcher, apiRequest } from '@/lib/fetcher';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { data, mutate } = useSWR<{
    items: NotificationItem[];
    unread: number;
  }>('/api/notifications', fetcher, { refreshInterval: 60_000 });
  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  async function markAllRead() {
    await apiRequest('/api/notifications', 'POST').catch(() => {});
    mutate();
  }

  return (
    <DropdownMenu onOpenChange={(o) => o && unread > 0 && markAllRead()}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Powiadomienia"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Powiadomienia</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Brak powiadomień.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <div
                key={n.id}
                className={`border-b px-3 py-2 text-sm last:border-0 ${n.read ? '' : 'bg-accent/40'}`}
              >
                <p className="font-medium">{n.title}</p>
                <p className="text-muted-foreground">{n.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString('pl-PL')}
                </p>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
