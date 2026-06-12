/**
 * Plik: app/api/auth/register/route.ts
 * Cel: Rejestracja użytkownika (e-mail + hasło). Walidacja Zod, hash bcrypt
 *      (12 rund), zapis do bazy, wpis audytu. Pierwszy zarejestrowany
 *      użytkownik otrzymuje rolę ADMIN, kolejni — EMPLOYEE.
 * Zależności: lib/prisma, lib/validations/auth, bcryptjs, lib/audit.
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations/auth';
import { createAuditLog } from '@/lib/audit';
import { Role } from '@prisma/client';

const BCRYPT_ROUNDS = 12;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, email, phone, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Konto z tym adresem e-mail już istnieje' },
        { status: 409 },
      );
    }

    // Pierwsze konto w systemie zostaje administratorem.
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? Role.ADMIN : Role.EMPLOYEE;

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone: phone || null,
        hashedPassword,
        role,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    await createAuditLog({
      userId: user.id,
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('[register] Błąd:', error);
    return NextResponse.json(
      { error: 'Wewnętrzny błąd serwera' },
      { status: 500 },
    );
  }
}
