/**
 * Plik: app/api/orders/[id]/costs/[costId]/route.ts
 * Cel: Usunięcie kosztu realizacji zlecenia (ADMIN). Zwraca przeliczoną rentowność.
 * Zależności: lib/prisma, lib/rbac, lib/finance.
 */
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';
import { orderProfitability } from '@/lib/finance';

type Params = { params: { id: string; costId: string } };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireRole(Role.ADMIN);
    await prisma.orderCost.deleteMany({
      where: { id: params.costId, orderId: params.id },
    });
    const result = await orderProfitability(params.id);
    return NextResponse.json(result);
  } catch (error) {
    return handleAuthError(error);
  }
}
