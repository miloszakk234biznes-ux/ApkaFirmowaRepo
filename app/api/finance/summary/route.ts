/**
 * Plik: app/api/finance/summary/route.ts
 * Cel: Zagregowane dane dashboardu finansowego (ADMIN) — KPI, serie M/M, koszty
 *      wg kategorii, statystyki, postęp celu, alerty.
 * Zależności: lib/rbac, lib/finance.
 */
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { requireRole, handleAuthError } from '@/lib/rbac';
import { getFinanceSummary } from '@/lib/finance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    const summary = await getFinanceSummary();
    return NextResponse.json(summary);
  } catch (error) {
    return handleAuthError(error);
  }
}
