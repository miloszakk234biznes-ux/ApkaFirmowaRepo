/**
 * Plik: app/api/expenses/[id]/route.ts
 * Cel: Edycja (PATCH) i usuwanie (DELETE) wydatku — ADMIN. Walidacja Zod, audit.
 * Zależności: lib/prisma, lib/rbac, lib/validations/finance, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';
import { updateExpenseSchema } from '@/lib/validations/finance';
import { createAuditLog } from '@/lib/audit';

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await requireRole(Role.ADMIN);
    const parsed = updateExpenseSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const data: Prisma.ExpenseUpdateInput = {
      category: d.category,
      description: d.description,
      paymentMethod: d.paymentMethod,
      receiptPhoto: d.receiptPhoto,
    };
    if (d.amount !== undefined) data.amount = new Prisma.Decimal(d.amount);
    if (d.date !== undefined) data.date = new Date(d.date);

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data,
    });
    await createAuditLog({
      userId: session.user.id,
      action: 'EXPENSE_UPDATE',
      entity: 'Expense',
      entityId: expense.id,
    });
    return NextResponse.json({ expense });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await requireRole(Role.ADMIN);
    await prisma.expense.delete({ where: { id: params.id } });
    await createAuditLog({
      userId: session.user.id,
      action: 'EXPENSE_DELETE',
      entity: 'Expense',
      entityId: params.id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
