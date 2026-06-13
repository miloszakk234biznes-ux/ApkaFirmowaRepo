/**
 * Plik: app/api/clients/[id]/route.ts
 * Cel: Operacje na kliencie: pobranie (GET — dane + statystyki + historia zleceń),
 *      edycja inline (PATCH), usunięcie (DELETE — tylko admin). Walidacja Zod.
 * Zależności: lib/prisma, lib/rbac, lib/clients, lib/validations/client, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import { clientStats } from '@/lib/clients';
import { updateClientSchema } from '@/lib/validations/client';
import { createAuditLog } from '@/lib/audit';

type Params = { params: { id: string } };

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireAuth();
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          orderBy: { scheduledAt: 'desc' },
          include: {
            assignedUser: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!client) {
      return NextResponse.json(
        { error: 'Klient nie istnieje' },
        { status: 404 },
      );
    }
    const stats = await clientStats(params.id);
    return NextResponse.json({ client, stats });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await requireAuth();
    const existing = await prisma.client.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Klient nie istnieje' },
        { status: 404 },
      );
    }

    const parsed = updateClientSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: parsed.data,
    });
    await createAuditLog({
      userId: session.user.id,
      action: 'CLIENT_UPDATE',
      entity: 'Client',
      entityId: client.id,
    });
    return NextResponse.json({ client });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    // Usuwanie klientów zarezerwowane dla administratora.
    const session = await requireAuth();
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }
    const existing = await prisma.client.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Klient nie istnieje' },
        { status: 404 },
      );
    }
    await prisma.client.delete({ where: { id: params.id } });
    await createAuditLog({
      userId: session.user.id,
      action: 'CLIENT_DELETE',
      entity: 'Client',
      entityId: params.id,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
