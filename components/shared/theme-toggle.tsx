/**
 * Plik: components/shared/theme-toggle.tsx
 * Cel: Przełącznik motywu jasny/ciemny/systemowy (next-themes) w formie menu.
 * Zależności: next-themes, components/ui/dropdown-menu, lucide-react.
 */
'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Zmień motyw">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Jasny
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Ciemny
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          Systemowy
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
