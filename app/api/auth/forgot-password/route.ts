/**
 * Plik: app/api/auth/forgot-password/route.ts
 * Cel: Inicjuje reset hasła — generuje token i wysyła link e-mailem.
 *      Ze względów bezpieczeństwa zawsze zwraca 200 (nie ujawnia, czy konto
 *      istnieje).
 * Zależności: lib/prisma, lib/validations/auth, lib/tokens, lib/email.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { createPasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/email';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowy adres e-mail' },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.active) {
      const rawToken = await createPasswordResetToken(user.id);
      const baseUrl =
        process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

      await sendPasswordResetEmail(user.email, resetUrl);
      await createAuditLog({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUEST',
        entity: 'User',
        entityId: user.id,
      });
    }

    // Zawsze ta sama odpowiedź — nie ujawniamy istnienia konta.
    return NextResponse.json({
      message:
        'Jeśli konto istnieje, wysłaliśmy link do resetu hasła na podany adres.',
    });
  } catch (error) {
    console.error('[forgot-password] Błąd:', error);
    return NextResponse.json(
      { error: 'Wewnętrzny błąd serwera' },
      { status: 500 },
    );
  }
}
