/**
 * Plik: components/shared/user-menu.tsx
 * Cel: Menu użytkownika w nagłówku — awatar, nazwa, rola oraz wylogowanie.
 * Zależności: next-auth/react, components/ui/avatar, components/ui/dropdown-menu.
 * Użycie: renderowane w nagłówku app/(dashboard)/layout.tsx.
 */
'use client';

import { signOut } from 'next-auth/react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Role } from '@prisma/client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
}

function initials(name?: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserMenu({ name, email, image, role }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar>
          {image ? <AvatarImage src={image} alt={name ?? 'Użytkownik'} /> : null}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{name ?? 'Użytkownik'}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {email}
            </span>
            <span className="mt-1 text-xs font-normal text-muted-foreground">
              Rola: {role === Role.ADMIN ? 'Administrator' : 'Pracownik'}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/settings" className="cursor-pointer">
            <UserIcon className="h-4 w-4" />
            Ustawienia konta
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4" />
          Wyloguj się
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
