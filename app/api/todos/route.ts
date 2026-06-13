/**
 * Plik: app/api/todos/route.ts
 * Cel: To-Do (zadania prywatne i firmowe) — lista wg roli/filtrów (GET) oraz
 *      tworzenie (POST). Pracownik widzi swoje prywatne + firmowe przypisane do
 *      niego (lub nieprzypisane); admin widzi wszystkie firmowe.
 * Zależności: lib/prisma, lib/rbac, lib/validations/documents, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { createTodoSchema } from '@/lib/validations/documents';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const sp = new URL(req.url).searchParams;
    const filter = sp.get('filter'); // open | done | overdue
    const scope = sp.get('scope'); // private | company | all

    const uid = session.user.id;
    const isAdmin = session.user.role === Role.ADMIN;

    // Widoczność: prywatne tego użytkownika + firmowe (admin: wszystkie;
    // pracownik: przypisane do niego lub nieprzypisane).
    const visibility: Prisma.TodoTaskWhereInput[] = [
      { isPrivate: true, userId: uid },
      isAdmin
        ? { isPrivate: false }
        : {
            isPrivate: false,
            OR: [{ assignedToId: uid }, { assignedToId: null, userId: uid }],
          },
    ];

    const where: Prisma.TodoTaskWhereInput = { OR: visibility };
    if (scope === 'private')
      Object.assign(where, { isPrivate: true, userId: uid });
    if (scope === 'company') Object.assign(where, { isPrivate: false });
    if (filter === 'open') where.completed = false;
    if (filter === 'done') where.completed = true;
    if (filter === 'overdue') {
      where.completed = false;
      where.dueDate = { lt: new Date() };
    }

    const todos = await prisma.todoTask.findMany({
      where,
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({ todos });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const parsed = createTodoSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    // Tylko admin może przypisać zadanie innemu pracownikowi.
    const assignedToId =
      session.user.role === Role.ADMIN ? (d.assignedToId ?? null) : null;

    const todo = await prisma.todoTask.create({
      data: {
        userId: session.user.id,
        assignedToId,
        title: d.title,
        description: d.description,
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        isPrivate: d.isPrivate,
        priority: d.priority,
        checklist: d.checklist ?? Prisma.JsonNull,
      },
    });
    await createAuditLog({
      userId: session.user.id,
      action: 'TODO_CREATE',
      entity: 'TodoTask',
      entityId: todo.id,
    });
    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
