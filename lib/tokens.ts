/**
 * Plik: lib/tokens.ts
 * Cel: Generowanie i weryfikacja tokenów resetu hasła (kryptograficznie losowe,
 *      hashowane przed zapisem do bazy — w bazie nie trzymamy surowego tokenu).
 * Zależności: crypto (Node), lib/prisma.
 */
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 60 minut

/** Hashuje token tak samo przy zapisie i weryfikacji. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Tworzy token resetu hasła dla użytkownika i zwraca surową wartość,
 * którą należy umieścić w linku e-mail. W bazie zapisujemy tylko hash.
 */
export async function createPasswordResetToken(
  userId: string,
): Promise<string> {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  // Unieważnij wcześniejsze, nieużyte tokeny tego użytkownika.
  await prisma.passwordResetToken.deleteMany({
    where: { userId, usedAt: null },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      token: tokenHash,
      expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

/**
 * Weryfikuje surowy token: zwraca rekord (z userId) jeśli ważny i nieużyty,
 * w przeciwnym razie null.
 */
export async function verifyPasswordResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
  });

  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expires < new Date()) return null;

  return record;
}

/** Oznacza token jako wykorzystany (po pomyślnej zmianie hasła). */
export async function consumePasswordResetToken(id: string): Promise<void> {
  await prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}
