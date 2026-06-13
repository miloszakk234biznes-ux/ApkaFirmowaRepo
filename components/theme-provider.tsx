/**
 * Plik: components/theme-provider.tsx
 * Cel: Owijka na next-themes umożliwiająca tryb jasny/ciemny (system + ręczny),
 *      zapamiętywany w localStorage (domyślne zachowanie next-themes).
 * Zależności: next-themes.
 */
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
