/**
 * Plik: app/api/expenses/route.ts
 * Cel: Wydatki (ADMIN) — lista z filtrami (okres, kategoria, forma płatności,
 *      paginacja) oraz tworzenie. Walidacja Zod, audit log.
 * Zależności: lib/prisma, lib/rbac, lib/validations/finance, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';
import {
  createExpenseSchema,
  financeQuerySchema,
} from '@/lib/validations/finance';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requireRole(Role.ADMIN);
    const parsed = financeQuerySchema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    if (!parsed.success) {
      return NextResponse.json({ error: 'Błędne parametry' }, { status: 400 });
    }
    const q = parsed.data;
    const where: Prisma.ExpenseWhereInput = {};
    if (q.category) where.category = q.category;
    if (q.paymentMethod) where.paymentMethod = q.paymentMethod;
    if (q.from || q.to) {
      where.date = {};
      if (q.from) where.date.gte = new Date(q.from);
      if (q.to) where.date.lte = new Date(q.to);
    }

    const [items, total, sumAgg] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      items,
      total,
      sum: Number(sumAgg._sum.amount ?? 0),
      page: q.page,
      pageSize: q.pageSize,
      totalPages: Math.ceil(total / q.pageSize),
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole(Role.ADMIN);
    const parsed = createExpenseSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        date: d.date ? new Date(d.date) : new Date(),
        amount: new Prisma.Decimal(d.amount),
        category: d.category,
        description: d.description,
        paymentMethod: d.paymentMethod,
        receiptPhoto: d.receiptPhoto,
        orderId: d.orderId,
      },
    });
    await createAuditLog({
      userId: session.user.id,
      action: 'EXPENSE_CREATE',
      entity: 'Expense',
      entityId: expense.id,
      details: `${d.category} ${d.amount}`,
    });
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
