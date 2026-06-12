/**
 * Plik: app/api/users/route.ts
 * Cel: Lista użytkowników (pracowników) do przypisywania zleceń i filtrów
 *      kalendarza. Dostępna tylko dla administratora (RBAC).
 * Zależności: lib/prisma, lib/rbac.
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return handleAuthError(error);
  }
}
