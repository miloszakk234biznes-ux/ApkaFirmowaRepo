/**
 * Plik: app/api/todos/[id]/route.ts
 * Cel: Aktualizacja (PATCH) i usunięcie (DELETE) zadania To-Do. Edytować może
 *      właściciel, przypisany pracownik lub admin.
 * Zależności: lib/prisma, lib/rbac, lib/validations/documents.
 */
import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { updateTodoSchema } from '@/lib/validations/documents';
import type { Session } from 'next-auth';

type Params = { params: { id: string } };

function canEdit(
  session: Session,
  todo: { userId: string; assignedToId: string | null },
): boolean {
  return (
    session.user.role === Role.ADMIN ||
    todo.userId === session.user.id ||
    todo.assignedToId === session.user.id
  );
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const existing = await prisma.todoTask.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Zadanie nie istnieje' },
        { status: 404 },
      );
    }
    if (!canEdit(session, existing)) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    const parsed = updateTodoSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const data: Prisma.TodoTaskUpdateInput = {
      title: d.title,
      description: d.description,
      priority: d.priority,
      completed: d.completed,
    };
    if (d.dueDate !== undefined) {
      data.dueDate = d.dueDate ? new Date(d.dueDate) : null;
    }
    if (d.checklist !== undefined) {
      data.checklist = d.checklist ?? Prisma.JsonNull;
    }
    // Przypisanie zmienia tylko admin.
    if (d.assignedToId !== undefined && session.user.role === Role.ADMIN) {
      data.assignedTo = d.assignedToId
        ? { connect: { id: d.assignedToId } }
        : { disconnect: true };
    }

    const todo = await prisma.todoTask.update({
      where: { id: params.id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({ todo });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const existing = await prisma.todoTask.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Zadanie nie istnieje' },
        { status: 404 },
      );
    }
    if (!canEdit(session, existing)) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }
    await prisma.todoTask.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
