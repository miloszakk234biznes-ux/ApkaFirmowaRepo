/**
 * Plik: app/api/clients/route.ts
 * Cel: CRM klientów: lista z fulltext (tsvector) + paginacją i agregatami
 *      (gdy podano `page`), autocomplete (gdy podano tylko `q`) oraz tworzenie
 *      klienta (POST, z deduplikacją po telefonie). RBAC: dane wspólne firmy
 *      — dostępne dla każdego zalogowanego.
 * Zależności: lib/prisma, lib/rbac, lib/clients, lib/validations/client, lib/audit.
 */
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/rbac';
import {
  createClientSchema,
  clientSearchSchema,
  clientListSchema,
} from '@/lib/validations/client';
import { listClients } from '@/lib/clients';
import { createAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET /api/clients
//   - z parametrem `page` → paginowana lista CRM z agregatami (fulltext tsvector)
//   - bez `page` → krótka lista do autocomplete (substring ILIKE)
export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const raw = Object.fromEntries(searchParams);

    // Tryb listy CRM.
    if ('page' in raw || 'pageSize' in raw || 'sort' in raw) {
      const parsed = clientListSchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Błędne parametry', issues: parsed.error.flatten() },
          { status: 400 },
        );
      }
      const { q, page, pageSize, sort, order } = parsed.data;
      const { rows, total } = await listClients({
        query: q,
        page,
        pageSize,
        sort,
        order,
      });
      return NextResponse.json({
        items: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    }

    // Tryb autocomplete.
    const parsed = clientSearchSchema.safeParse(raw);
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
