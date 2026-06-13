/**
 * Plik: components/settings/users-card.tsx
 * Cel: Panel administratora „Pracownicy" — lista kont, dodawanie pracownika,
 *      blokowanie/odblokowanie, zmiana roli, reset hasła. Tylko dla ADMIN.
 * Zależności: swr, lib/fetcher, components/ui/*.
 * Użycie: app/(dashboard)/settings/page.tsx (sekcja admina).
 */
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { UserPlus, ShieldCheck, ShieldOff, KeyRound, Plus } from 'lucide-react';
import { Role } from '@prisma/client';
import { createUserSchema, type CreateUserInput } from '@/lib/validations/user';
import { fetcher, apiRequest } from '@/lib/fetcher';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  active: boolean;
}

export function UsersCard({ currentUserId }: { currentUserId: string }) {
  const { data, mutate } = useSWR<{ users: UserRow[] }>(
    '/api/users?all=1',
    fetcher,
  );
  const [open, setOpen] = React.useState(false);
  const users = data?.users ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: Role.EMPLOYEE },
  });

  React.useEffect(() => {
    if (open) reset({ role: Role.EMPLOYEE, name: '', email: '', password: '' });
  }, [open, reset]);

  async function addUser(d: CreateUserInput) {
    try {
      await apiRequest('/api/users', 'POST', d);
      toast.success('Dodano pracownika');
      setOpen(false);
      mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd');
    }
  }

  async function patch(id: string, body: Record<string, unknown>, ok: string) {
    try {
      await apiRequest(`/api/users/${id}`, 'PATCH', body);
      toast.success(ok);
      mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd');
    }
  }

  async function resetPassword(id: string) {
    const password = prompt('Nowe hasło (min. 8 znaków, litera + cyfra):');
    if (!password) return;
    await patch(id, { password }, 'Hasło zmienione');
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Pracownicy</CardTitle>
          <CardDescription>
            Twórz konta, zmieniaj role i blokuj dostęp. Rejestracja publiczna
            jest wyłączona — konta dodaje administrator.
          </CardDescription>
        </div>
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="h-4 w-4" /> Dodaj pracownika
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Osoba</TableHead>
              <TableHead>Rola</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) =>
                        patch(u.id, { role: v }, 'Zmieniono rolę')
                      }
                      disabled={isSelf}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Administrator</SelectItem>
                        <SelectItem value="EMPLOYEE">Pracownik</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {u.active ? (
                      <Badge variant="secondary">aktywny</Badge>
                    ) : (
                      <Badge variant="destructive">zablokowany</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Reset hasła"
                        onClick={() => resetPassword(u.id)}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      {u.active ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Zablokuj"
                          disabled={isSelf}
                          onClick={() =>
                            patch(u.id, { active: false }, 'Zablokowano')
                          }
                        >
                          <ShieldOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Odblokuj"
                          onClick={() =>
                            patch(u.id, { active: true }, 'Odblokowano')
                          }
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowy pracownik</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(addUser)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-name">Imię i nazwisko *</Label>
              <Input id="u-name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-email">E-mail *</Label>
              <Input id="u-email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-phone">Telefon</Label>
              <Input id="u-phone" type="tel" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-pass">Hasło startowe *</Label>
              <Input id="u-pass" type="text" {...register('password')} />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Przekaż je pracownikowi — zmieni je przy pierwszym logowaniu.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Rola</Label>
              <Select
                defaultValue={Role.EMPLOYEE}
                onValueChange={(v) => setValue('role', v as Role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Pracownik</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Anuluj
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4" /> Dodaj
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
