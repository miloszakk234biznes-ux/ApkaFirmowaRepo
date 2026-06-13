/**
 * Plik: app/api/goals/route.ts
 * Cel: Cele finansowe (ADMIN) — lista (GET) oraz utworzenie/aktualizacja celu
 *      dla danego miesiąca/roku (POST upsert, unikat year+month).
 * Zależności: lib/prisma, lib/rbac, lib/validations/finance, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';
import { upsertGoalSchema } from '@/lib/validations/finance';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    const goals = await prisma.financialGoal.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 24,
    });
    return NextResponse.json({ goals });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole(Role.ADMIN);
    const parsed = upsertGoalSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const goal = await prisma.financialGoal.upsert({
      where: { year_month: { year: d.year, month: d.month } },
      create: {
        year: d.year,
        month: d.month,
        targetRevenue: new Prisma.Decimal(d.targetRevenue),
        targetProfit: new Prisma.Decimal(d.targetProfit),
        targetOrders: d.targetOrders,
      },
      update: {
        targetRevenue: new Prisma.Decimal(d.targetRevenue),
        targetProfit: new Prisma.Decimal(d.targetProfit),
        targetOrders: d.targetOrders,
      },
    });
    await createAuditLog({
      userId: session.user.id,
      action: 'GOAL_UPSERT',
      entity: 'FinancialGoal',
      entityId: goal.id,
      details: `${d.year}-${d.month}`,
    });
    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
