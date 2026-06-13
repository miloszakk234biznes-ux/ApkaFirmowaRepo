/**
 * Plik: app/(dashboard)/todo/page.tsx
 * Cel: Moduł To-Do — zadania prywatne i firmowe, checklisty, terminy, filtry.
 * Zależności: lib/auth, components/todo/todo-board.
 */
import { Role } from '@prisma/client';
import { auth } from '@/lib/auth';
import { TodoBoard } from '@/components/todo/todo-board';

export default async function TodoPage() {
  const session = await auth();
  const role = session?.user?.role ?? Role.EMPLOYEE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">To-Do</h1>
        <p className="text-muted-foreground">
          Zadania prywatne i firmowe, checklisty i terminy.
        </p>
      </div>
      <TodoBoard role={role} />
    </div>
  );
}
