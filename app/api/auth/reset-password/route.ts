/**
 * Plik: app/api/auth/reset-password/route.ts
 * Cel: Finalizuje reset hasła — weryfikuje token, ustawia nowe hasło (bcrypt),
 *      unieważnia token i zapisuje wpis audytu.
 * Zależności: lib/prisma, lib/validations/auth, lib/tokens, bcryptjs, lib/audit.
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { resetPasswordSchema } from '@/lib/validations/auth';
import {
  verifyPasswordResetToken,
  consumePasswordResetToken,
} from '@/lib/tokens';
import { createAuditLog } from '@/lib/audit';

const BCRYPT_ROUNDS = 12;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;
    const record = await verifyPasswordResetToken(token);

    if (!record) {
      return NextResponse.json(
        { error: 'Link resetu jest nieprawidłowy lub wygasł' },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { hashedPassword },
      }),
    ]);
    await consumePasswordResetToken(record.id);

    await createAuditLog({
      userId: record.userId,
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: record.userId,
    });

    return NextResponse.json({ message: 'Hasło zostało zmienione' });
  } catch (error) {
    console.error('[reset-password] Błąd:', error);
    return NextResponse.json(
      { error: 'Wewnętrzny błąd serwera' },
      { status: 500 },
    );
  }
}
