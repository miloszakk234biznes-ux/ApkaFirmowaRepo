/**
 * Plik: app/layout.tsx
 * Cel: Root layout aplikacji — fonty, metadane, providery (sesja/motyw/toaster).
 * Zależności: next/font, app/providers, app/globals.css.
 */
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'ApkaFirmowa — zarządzanie firmą usługową',
    template: '%s · ApkaFirmowa',
  },
  description:
    'Kalendarz zleceń, CRM klientów i finanse firmy usługowej w jednym miejscu.',
  applicationName: 'ApkaFirmowa',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
