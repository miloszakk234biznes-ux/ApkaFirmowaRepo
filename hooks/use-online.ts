/**
 * Plik: hooks/use-online.ts
 * Cel: Hook stanu połączenia (online/offline) reagujący na zdarzenia przeglądarki.
 * Zależności: React.
 */
'use client';

import * as React from 'react';

export function useOnline(): boolean {
  const [online, setOnline] = React.useState(true);

  React.useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}
