/**
 * Plik: components/shared/bottom-nav.tsx
 * Cel: Dolna nawigacja mobilna (5 ikon, tap target ≥ 48px). Widoczna tylko na
 *      małych ekranach; podświetla aktywną trasę. Filtruje wg roli.
 * Zależności: lib/navigation, next/navigation, lib/utils.
 * Użycie: renderowany w app/(dashboard)/layout.tsx (ukryty na desktop).
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role } from '@prisma/client';
import { bottomNavItems, visibleNavItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = visibleNavItems(bottomNavItems, role);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card md:hidden">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs',
              'min-h-[56px]',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
