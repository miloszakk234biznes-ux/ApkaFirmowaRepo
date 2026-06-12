/**
 * Plik: components/shared/sidebar.tsx
 * Cel: Lewy sidebar nawigacyjny (desktop) z ikonami i etykietami, podświetlenie
 *      aktywnej trasy. Filtruje pozycje wg roli zalogowanego użytkownika.
 * Zależności: lib/navigation, next/navigation, lib/utils.
 * Użycie: renderowany w app/(dashboard)/layout.tsx (ukryty na mobile).
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role } from '@prisma/client';
import { navItems, visibleNavItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = visibleNavItems(navItems, role);

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <span className="text-lg font-bold">ApkaFirmowa</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
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
    </aside>
  );
}
