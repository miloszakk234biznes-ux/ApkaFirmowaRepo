/**
 * Plik: components/shared/bottom-nav.tsx
 * Cel: Dolna nawigacja mobilna — 4 szybkie skróty + przycisk „Więcej", który
 *      otwiera pełne menu ze WSZYSTKIMI zakładkami (Zlecenia, Mapa, Finanse,
 *      Raporty, To-Do, Ustawienia…) filtrowanymi wg roli. Widoczna tylko na
 *      małych ekranach; podświetla aktywną trasę.
 * Zależności: lib/navigation, components/ui/sheet, next/navigation, lib/utils.
 * Użycie: renderowany w app/(dashboard)/layout.tsx (ukryty na desktop).
 */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Role } from '@prisma/client';
import { bottomNavItems, navItems, visibleNavItems } from '@/lib/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const quick = visibleNavItems(bottomNavItems, role);
  const all = visibleNavItems(navItems, role);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card md:hidden">
        {quick.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 text-xs',
                isActive(item.href) ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        {/* Przycisk „Więcej" — otwiera pełne menu. */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 text-xs text-muted-foreground"
          aria-label="Więcej"
        >
          <Menu className="h-5 w-5" />
          Więcej
        </button>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-xl pb-8">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {all.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-center text-sm',
                    isActive(item.href)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:bg-accent',
                  )}
                >
                  <Icon className="h-6 w-6" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
