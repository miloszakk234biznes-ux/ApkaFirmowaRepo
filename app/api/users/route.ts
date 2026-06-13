/**
 * Plik: app/api/users/route.ts
 * Cel: Pracownicy (ADMIN) — lista do przypisań/filtrów (GET; `?all=1` zwraca
 *      wszystkich z polem active do panelu zarządzania) oraz tworzenie konta
 *      pracownika (POST). Bcrypt 12 rund, audit log.
 * Zależności: lib/prisma, lib/rbac, lib/validations/user, bcryptjs, lib/audit.
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';
import { createUserSchema } from '@/lib/validations/user';
import { createAuditLog } from '@/lib/audit';

const BCRYPT_ROUNDS = 12;

export async function GET(req: Request) {
  try {
    await requireRole(Role.ADMIN);
    const all = new URL(req.url).searchParams.get('all') === '1';
    const users = await prisma.user.findMany({
      where: all ? {} : { active: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        phone: true,
        createdAt: true,
      },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
    return NextResponse.json({ users });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole(Role.ADMIN);
    const parsed = createUserSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const email = d.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Konto z tym adresem e-mail już istnieje' },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(d.password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name: d.name,
        email,
        phone: d.phone || null,
        role: d.role,
        hashedPassword,
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'USER_CREATE',
      entity: 'User',
      entityId: user.id,
      details: `${user.email} (${user.role})`,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
