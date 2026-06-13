/**
 * Plik: app/providers.tsx
 * Cel: Klientowe providery aplikacji: sesja NextAuth, motyw (dark/light),
 *      globalny Toaster. Montowane raz w root layout.
 * Zależności: next-auth/react, components/theme-provider, components/ui/sonner.
 */
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </SessionProvider>
  );
}
