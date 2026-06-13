/**
 * Plik: components/pwa/install-prompt.tsx
 * Cel: Własny baner „Dodaj do ekranu głównego" — przechwytuje BeforeInstallPromptEvent
 *      (Android/Chrome) i pozwala zainstalować PWA. Zapamiętuje odrzucenie w
 *      localStorage. Na iOS pokazuje krótką instrukcję (brak natywnego promptu).
 * Zależności: components/ui/button, lucide-react.
 */
'use client';

import * as React from 'react';
import { Download, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'apka-install-dismissed';

export function InstallPrompt() {
  const [deferred, setDeferred] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);

  React.useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Wykrycie iOS (brak beforeinstallprompt) oraz trybu standalone.
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error - iOS Safari
      window.navigator.standalone === true;
    if (standalone) return;

    if (ios) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, '1');
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-lg border bg-card p-4 shadow-xl md:bottom-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Zainstaluj ApkaFirmowa</p>
          {isIOS ? (
            <p className="text-sm text-muted-foreground">
              Dotknij <Share className="inline h-3.5 w-3.5" /> a następnie „Do
              ekranu początkowego".
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Dodaj aplikację do ekranu głównego, by działała jak natywna.
            </p>
          )}
          {!isIOS && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={install}>
                Zainstaluj
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Później
              </Button>
            </div>
          )}
        </div>
        <button type="button" onClick={dismiss} aria-label="Zamknij">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
