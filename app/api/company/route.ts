/**
 * Plik: app/api/company/route.ts
 * Cel: Dane firmy (sprzedawca) do faktur — odczyt (GET, każdy zalogowany) i zapis
 *      (PUT, ADMIN). Singleton o id "default".
 * Zależności: lib/prisma, lib/rbac, lib/validations/documents, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole, handleAuthError } from '@/lib/rbac';
import { companySettingsSchema } from '@/lib/validations/documents';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth();
    const company = await prisma.companySettings.findUnique({
      where: { id: 'default' },
    });
    return NextResponse.json({ company });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireRole(Role.ADMIN);
    const parsed = companySettingsSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const company = await prisma.companySettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...parsed.data },
      update: parsed.data,
    });
    await createAuditLog({
      userId: session.user.id,
      action: 'COMPANY_UPDATE',
      entity: 'CompanySettings',
      entityId: 'default',
    });
    return NextResponse.json({ company });
  } catch (error) {
    return handleAuthError(error);
  }
}
