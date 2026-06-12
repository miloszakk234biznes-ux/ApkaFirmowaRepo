/**
 * Plik: components/orders/client-combobox.tsx
 * Cel: Autocomplete klienta po nazwisku/telefonie/adresie (min. 2 znaki). Wybór
 *      istniejącego klienta wypełnia jego dane; można też wpisać nowego klienta
 *      (telefon/imię/nazwisko podawane osobno w formularzu).
 * Zależności: components/ui/{popover,command}, lib/fetcher, types.
 * Użycie: w order-form.tsx.
 */
'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { fetcher } from '@/lib/fetcher';
import { cn } from '@/lib/utils';
import type { ClientFull } from '@/types';

interface ClientComboboxProps {
  value?: ClientFull | null;
  onSelect: (client: ClientFull | null) => void;
}

export function ClientCombobox({ value, onSelect }: ClientComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<ClientFull[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Debounce zapytania (autocomplete po ≥ 2 znakach).
  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetcher<{ clients: ClientFull[] }>(
          `/api/clients?q=${encodeURIComponent(query.trim())}`,
        );
        setResults(data.clients);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query]);

  const label = value
    ? `${value.firstName} ${value.lastName}${value.phone ? ` · ${value.phone}` : ''}`
    : 'Wyszukaj klienta…';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value && 'text-muted-foreground')}>{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nazwisko, telefon lub adres…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {value && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onSelect(null);
                    setOpen(false);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Wyczyść / nowy klient
                </CommandItem>
              </CommandGroup>
            )}
            {loading && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Szukam…
              </div>
            )}
            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <CommandEmpty>
                Brak wyników — dane nowego klienta wpisz poniżej.
              </CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup heading="Klienci">
                {results.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={() => {
                      onSelect(c);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value?.id === c.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="flex flex-col">
                      <span>
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {[c.phone, c.address].filter(Boolean).join(' · ') ||
                          'brak danych kontaktowych'}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
