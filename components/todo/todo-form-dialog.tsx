/**
 * Plik: components/todo/todo-form-dialog.tsx
 * Cel: Modal tworzenia zadania To-Do — tytuł, opis, termin, priorytet, prywatne/
 *      firmowe, przypisanie (admin), checklista.
 * Zależności: react-hook-form, zod, components/ui/*, hooks/use-users, lib/fetcher.
 */
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { Role } from '@prisma/client';
import {
  createTodoSchema,
  type CreateTodoInput,
} from '@/lib/validations/documents';
import { apiRequest } from '@/lib/fetcher';
import { useUsers } from '@/hooks/use-users';
import { PRIORITY_OPTIONS } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function TodoFormDialog({
  open,
  onOpenChange,
  role,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  role: Role;
  onSaved?: () => void;
}) {
  const isAdmin = role === Role.ADMIN;
  const { users } = useUsers(isAdmin);
  const [submitting, setSubmitting] = React.useState(false);
  const [checklist, setChecklist] = React.useState<string[]>([]);
  const [checkText, setCheckText] = React.useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateTodoInput>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: { isPrivate: true, priority: 'NORMAL' },
  });

  React.useEffect(() => {
    if (open) {
      reset({ isPrivate: true, priority: 'NORMAL', title: '' });
      setChecklist([]);
    }
  }, [open, reset]);

  async function onSubmit(data: CreateTodoInput) {
    setSubmitting(true);
    try {
      await apiRequest('/api/todos', 'POST', {
        ...data,
        dueDate: data.dueDate
          ? new Date(data.dueDate).toISOString()
          : undefined,
        checklist: checklist.map((text) => ({ text, done: false })),
      });
      toast.success('Zadanie dodane');
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Błąd zapisu');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowe zadanie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tytuł *</Label>
            <Input id="title" {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea id="description" rows={2} {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Termin</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate', {
                  setValueAs: (v) =>
                    v ? new Date(v).toISOString() : undefined,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Priorytet</Label>
              <Select
                defaultValue="NORMAL"
                onValueChange={(v) =>
                  setValue('priority', v as CreateTodoInput['priority'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4"
              {...register('isPrivate')}
            />
            Zadanie prywatne (tylko dla mnie)
          </label>

          {isAdmin && (
            <div className="space-y-2">
              <Label>Przypisz do (zadanie firmowe)</Label>
              <Select onValueChange={(v) => setValue('assignedToId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nikt" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Checklista */}
          <div className="space-y-2">
            <Label>Checklista</Label>
            <div className="flex gap-2">
              <Input
                value={checkText}
                onChange={(e) => setCheckText(e.target.value)}
                placeholder="Element checklisty"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (checkText.trim()) {
                      setChecklist((c) => [...c, checkText.trim()]);
                      setCheckText('');
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (checkText.trim()) {
                    setChecklist((c) => [...c, checkText.trim()]);
                    setCheckText('');
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {checklist.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border px-2 py-1 text-sm"
              >
                {c}
                <button
                  type="button"
                  onClick={() =>
                    setChecklist((l) => l.filter((_, j) => j !== i))
                  }
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Zapisywanie…' : 'Dodaj zadanie'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
