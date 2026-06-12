/**
 * Plik: app/api/clients/route.ts
 * Cel: Minimalny CRM na potrzeby zleceń: wyszukiwanie klientów (GET ?q= — dla
 *      autocomplete po nazwisku/telefonie/adresie) oraz tworzenie klienta (POST,
 *      z deduplikacją po numerze telefonu). Pełny CRM rozszerzamy w Etapie 4.
 * Zależności: lib/prisma, lib/rbac, lib/validations/client, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import {
  createClientSchema,
  clientSearchSchema,
} from '@/lib/validations/client';
import { createAuditLog } from '@/lib/audit';

// GET /api/clients?q=... — wyszukiwarka do autocomplete.
export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const parsed = clientSearchSchema.safeParse(
      Object.fromEntries(searchParams),
    );
    if (!parsed.success) {
      return NextResponse.json({ error: 'Błędne parametry' }, { status: 400 });
    }
    const { q, limit } = parsed.data;

    const where: Prisma.ClientWhereInput = q
      ? {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { address: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const clients = await prisma.client.findMany({
      where,
      orderBy: { lastName: 'asc' },
      take: limit,
    });

    return NextResponse.json({ clients });
  } catch (error) {
    return handleAuthError(error);
  }
}

// POST /api/clients — utwórz klienta (dedupe po telefonie).
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = createClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;

    if (d.phone) {
      const existing = await prisma.client.findFirst({
        where: { phone: d.phone },
      });
      if (existing) {
        return NextResponse.json(
          { client: existing, duplicate: true },
          { status: 200 },
        );
      }
    }

    const client = await prisma.client.create({ data: d });
    await createAuditLog({
      userId: session.user.id,
      action: 'CLIENT_CREATE',
      entity: 'Client',
      entityId: client.id,
    });
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
