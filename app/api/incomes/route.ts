/**
 * Plik: app/api/incomes/route.ts
 * Cel: Przychody (ADMIN) — lista z filtrami okresu i paginacją oraz ręczne
 *      dodawanie przychodu. Automatyczne przychody (DONE) tworzy lib/finance.
 * Zależności: lib/prisma, lib/rbac, lib/validations/finance, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';
import {
  createIncomeSchema,
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
    const where: Prisma.IncomeWhereInput = {};
    if (q.from || q.to) {
      where.date = {};
      if (q.from) where.date.gte = new Date(q.from);
      if (q.to) where.date.lte = new Date(q.to);
    }

    const [items, total, sumAgg] = await Promise.all([
      prisma.income.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { order: { select: { id: true, title: true } } },
      }),
      prisma.income.count({ where }),
      prisma.income.aggregate({ where, _sum: { amount: true } }),
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
    const parsed = createIncomeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const income = await prisma.income.create({
      data: {
        date: d.date ? new Date(d.date) : new Date(),
        amount: new Prisma.Decimal(d.amount),
        description: d.description,
        source: d.source ?? 'MANUAL',
        orderId: d.orderId,
      },
    });
    await createAuditLog({
      userId: session.user.id,
      action: 'INCOME_CREATE',
      entity: 'Income',
      entityId: income.id,
      details: String(d.amount),
    });
    return NextResponse.json({ income }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
