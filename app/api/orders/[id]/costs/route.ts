/**
 * Plik: app/api/orders/[id]/costs/route.ts
 * Cel: Koszty realizacji zlecenia (rentowność) — lista z wyliczeniem zysku/marży
 *      (GET) oraz dodanie kosztu (POST). ADMIN (dane finansowe).
 * Zależności: lib/prisma, lib/rbac, lib/finance, lib/validations/finance, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';
import { orderProfitability } from '@/lib/finance';
import { createOrderCostSchema } from '@/lib/validations/finance';
import { createAuditLog } from '@/lib/audit';

type Params = { params: { id: string } };

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireRole(Role.ADMIN);
    const result = await orderProfitability(params.id);
    if (!result) {
      return NextResponse.json(
        { error: 'Zlecenie nie istnieje' },
        { status: 404 },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await requireRole(Role.ADMIN);
    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) {
      return NextResponse.json(
        { error: 'Zlecenie nie istnieje' },
        { status: 404 },
      );
    }
    const parsed = createOrderCostSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    await prisma.orderCost.create({
      data: {
        orderId: params.id,
        category: d.category,
        description: d.description,
        amount: new Prisma.Decimal(d.amount),
      },
    });
    await createAuditLog({
      userId: session.user.id,
      action: 'ORDER_COST_ADD',
      entity: 'Order',
      entityId: params.id,
      details: `${d.category} ${d.amount}`,
    });
    const result = await orderProfitability(params.id);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
