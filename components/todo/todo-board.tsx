/**
 * Plik: components/todo/todo-board.tsx
 * Cel: Lista zadań To-Do z filtrami (otwarte/zamknięte/przeterminowane, zakres
 *      prywatne/firmowe), przełączaniem statusu, checklistami i usuwaniem.
 * Zależności: swr, lib/fetcher, components/todo/todo-form-dialog, components/ui/*.
 */
'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Plus, Trash2, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { Role, Priority } from '@prisma/client';
import { fetcher, apiRequest } from '@/lib/fetcher';
import { formatDate } from '@/lib/utils';
import { PRIORITY } from '@/lib/constants';
import { buildQuery } from '@/hooks/use-orders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TodoFormDialog } from '@/components/todo/todo-form-dialog';

interface ChecklistItem {
  text: string;
  done: boolean;
}
interface Todo {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  isPrivate: boolean;
  priority: Priority;
  checklist: ChecklistItem[] | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
}

export function TodoBoard({ role }: { role: Role }) {
  const [filter, setFilter] = React.useState('all');
  const [scope, setScope] = React.useState('all');
  const [open, setOpen] = React.useState(false);

  const key = `/api/todos${buildQuery({
    filter: filter === 'all' ? undefined : filter,
    scope: scope === 'all' ? undefined : scope,
  })}`;
  const { data, isLoading, mutate } = useSWR<{ todos: Todo[] }>(key, fetcher);
  const todos = data?.todos ?? [];

  async function toggle(t: Todo) {
    try {
      await apiRequest(`/api/todos/${t.id}`, 'PATCH', {
        completed: !t.completed,
      });
      mutate();
    } catch {
      toast.error('Błąd');
    }
  }

  async function toggleChecklist(t: Todo, index: number) {
    const list = (t.checklist ?? []).map((c, i) =>
      i === index ? { ...c, done: !c.done } : c,
    );
    try {
      await apiRequest(`/api/todos/${t.id}`, 'PATCH', { checklist: list });
      mutate();
    } catch {
      toast.error('Błąd');
    }
  }

  async function remove(id: string) {
    if (!confirm('Usunąć zadanie?')) return;
    try {
      await apiRequest(`/api/todos/${id}`, 'DELETE');
      mutate();
    } catch {
      toast.error('Błąd usuwania');
    }
  }

  const isOverdue = (t: Todo) =>
    !t.completed && t.dueDate && new Date(t.dueDate) < new Date();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="open">Otwarte</SelectItem>
              <SelectItem value="done">Zamknięte</SelectItem>
              <SelectItem value="overdue">Przeterminowane</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="private">Prywatne</SelectItem>
              <SelectItem value="company">Firmowe</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Nowe zadanie
        </Button>
      </div>

      {isLoading && <Skeleton className="h-40 w-full rounded-lg" />}
      {!isLoading && todos.length === 0 && (
        <p className="rounded-lg border p-8 text-center text-muted-foreground">
          Brak zadań.
        </p>
      )}

      <div className="space-y-2">
        {todos.map((t) => {
          const done = t.checklist?.filter((c) => c.done).length ?? 0;
          const total = t.checklist?.length ?? 0;
          return (
            <div
              key={t.id}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => toggle(t)}
                className="mt-1 h-5 w-5 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-medium ${t.completed ? 'text-muted-foreground line-through' : ''}`}
                  >
                    {t.title}
                  </span>
                  <Badge variant="secondary">
                    {t.isPrivate ? 'prywatne' : 'firmowe'}
                  </Badge>
                  <span className={`text-xs ${PRIORITY[t.priority].className}`}>
                    {PRIORITY[t.priority].label}
                  </span>
                  {isOverdue(t) && (
                    <Badge variant="destructive">przeterminowane</Badge>
                  )}
                </div>
                {t.description && (
                  <p className="text-sm text-muted-foreground">
                    {t.description}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {t.dueDate && (
                    <span className="flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      {formatDate(t.dueDate)}
                    </span>
                  )}
                  {t.assignedTo && (
                    <span>→ {t.assignedTo.name ?? t.assignedTo.email}</span>
                  )}
                  {total > 0 && (
                    <span>
                      Checklista: {done}/{total}
                    </span>
                  )}
                </div>
                {total > 0 && (
                  <div className="mt-2 space-y-1">
                    {t.checklist!.map((c, i) => (
                      <label
                        key={i}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={c.done}
                          onChange={() => toggleChecklist(t, i)}
                          className="h-4 w-4"
                        />
                        <span
                          className={
                            c.done ? 'text-muted-foreground line-through' : ''
                          }
                        >
                          {c.text}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label="Usuń"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </div>
          );
        })}
      </div>

      <TodoFormDialog
        open={open}
        onOpenChange={setOpen}
        role={role}
        onSaved={() => mutate()}
      />
    </div>
  );
}
