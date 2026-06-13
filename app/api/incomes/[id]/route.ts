/**
 * Plik: app/api/incomes/[id]/route.ts
 * Cel: Usuwanie ręcznego przychodu (ADMIN). Audit log.
 * Zależności: lib/prisma, lib/rbac, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await requireRole(Role.ADMIN);
    await prisma.income.delete({ where: { id: params.id } });
    await createAuditLog({
      userId: session.user.id,
      action: 'INCOME_DELETE',
      entity: 'Income',
      entityId: params.id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
