/**
 * Plik: app/(auth)/layout.tsx
 * Cel: Layout dla stron autoryzacji (logowanie/rejestracja/reset) — wyśrodkowana
 *      karta na neutralnym tle, z przełącznikiem motywu w rogu.
 * Zależności: components/shared/theme-toggle.
 */
import { ThemeToggle } from '@/components/shared/theme-toggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
