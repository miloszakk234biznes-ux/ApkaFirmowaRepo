/**
 * Plik: lib/navigation.ts
 * Cel: Centralna definicja pozycji nawigacji (sidebar desktop + bottom nav).
 *      Każda pozycja niesie informację, czy jest dostępna tylko dla admina.
 * Zależności: lucide-react (typy ikon).
 */
import {
  LayoutDashboard,
  Calendar,
  Users,
  Wallet,
  ListTodo,
  FileText,
  Settings,
  Menu,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { Role } from '@prisma/client';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Jeśli ustawione, pozycja widoczna tylko dla tych ról. */
  roles?: Role[];
}

/** Pełna nawigacja boczna (desktop). */
export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Kalendarz', href: '/calendar', icon: Calendar },
  { label: 'Zlecenia', href: '/orders', icon: FileText },
  { label: 'Klienci', href: '/clients', icon: Users },
  { label: 'Mapa', href: '/map', icon: MapPin },
  { label: 'Finanse', href: '/finances', icon: Wallet, roles: [Role.ADMIN] },
  { label: 'Raporty', href: '/reports', icon: FileText, roles: [Role.ADMIN] },
  { label: 'To-Do', href: '/todo', icon: ListTodo },
  { label: 'Ustawienia', href: '/settings', icon: Settings },
];

/** Skrócona nawigacja dolna (mobile) — maks. 5 ikon. */
export const bottomNavItems: NavItem[] = [
  { label: 'Pulpit', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Kalendarz', href: '/calendar', icon: Calendar },
  { label: 'Klienci', href: '/clients', icon: Users },
  { label: 'Finanse', href: '/finances', icon: Wallet, roles: [Role.ADMIN] },
  { label: 'Menu', href: '/settings', icon: Menu },
];

/** Filtruje pozycje nawigacji wg roli użytkownika. */
export function visibleNavItems(items: NavItem[], role: Role): NavItem[] {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}
