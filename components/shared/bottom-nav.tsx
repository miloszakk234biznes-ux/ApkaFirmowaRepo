/**
 * Plik: components/shared/bottom-nav.tsx
 * Cel: Dolna nawigacja mobilna — 4 szybkie skróty + hamburger (prawy dolny róg),
 *      który wysuwa BOCZNE menu ze WSZYSTKIMI zakładkami (jak sidebar na desktopie),
 *      filtrowanymi wg roli. Ustawienia konta są pod ikoną profilu w nagłówku.
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

        {/* Hamburger (prawy dolny róg) — wysuwa boczne menu z wszystkimi zakładkami. */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2 text-xs text-muted-foreground"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </nav>

      {/* Boczne menu (drawer) — pełna nawigacja jak sidebar na desktopie. */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle className="text-left text-lg font-bold">
              ApkaFirmowa
            </SheetTitle>
          </SheetHeader>
          <nav className="space-y-1 p-3">
            {all.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
