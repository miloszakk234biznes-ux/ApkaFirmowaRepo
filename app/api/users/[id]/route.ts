/**
 * Plik: app/api/users/[id]/route.ts
 * Cel: Zarządzanie kontem pracownika przez administratora (PATCH): zmiana roli,
 *      blokada/odblokowanie (active), zmiana imienia, reset hasła. Zabezpieczenia:
 *      admin nie może zablokować/zdegradować samego siebie ani usunąć ostatniego
 *      administratora.
 * Zależności: lib/prisma, lib/rbac, lib/validations/user, bcryptjs, lib/audit.
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, handleAuthError } from '@/lib/rbac';
import { updateUserSchema } from '@/lib/validations/user';
import { createAuditLog } from '@/lib/audit';

type Params = { params: { id: string } };
const BCRYPT_ROUNDS = 12;

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await requireRole(Role.ADMIN);
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json(
        { error: 'Użytkownik nie istnieje' },
        { status: 404 },
      );
    }

    const parsed = updateUserSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const isSelf = target.id === session.user.id;

    // Zabezpieczenia przed zablokowaniem się / utratą ostatniego admina.
    if (isSelf && (d.active === false || d.role === Role.EMPLOYEE)) {
      return NextResponse.json(
        { error: 'Nie możesz zablokować ani zdegradować własnego konta.' },
        { status: 400 },
      );
    }
    if (
      target.role === Role.ADMIN &&
      (d.role === Role.EMPLOYEE || d.active === false)
    ) {
      const otherAdmins = await prisma.user.count({
        where: { role: Role.ADMIN, active: true, id: { not: target.id } },
      });
      if (otherAdmins === 0) {
        return NextResponse.json(
          { error: 'To jedyny aktywny administrator — nie można go wyłączyć.' },
          { status: 400 },
        );
      }
    }

    const data: Prisma.UserUpdateInput = {
      name: d.name,
      role: d.role,
      active: d.active,
    };
    if (d.password) {
      data.hashedPassword = await bcrypt.hash(d.password, BCRYPT_ROUNDS);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'USER_UPDATE',
      entity: 'User',
      entityId: user.id,
      details: JSON.stringify({
        role: d.role,
        active: d.active,
        passwordReset: !!d.password,
      }),
    });
    return NextResponse.json({ user });
  } catch (error) {
    return handleAuthError(error);
  }
}
