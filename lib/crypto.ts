/**
 * Plik: lib/crypto.ts
 * Cel: Symetryczne szyfrowanie wrażliwych danych (refresh token Google) — AES-256-GCM.
 *      Klucz pochodzi z ENCRYPTION_KEY (zalecane) lub jest wyprowadzany z
 *      NEXTAUTH_SECRET (fallback dev). Format wyniku: base64(iv).base64(tag).base64(ct).
 * Zależności: node:crypto.
 */
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'node:crypto';

/** Zwraca 32-bajtowy klucz szyfrujący (z ENCRYPTION_KEY lub NEXTAUTH_SECRET). */
function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? process.env.NEXTAUTH_SECRET;
  if (!raw) {
    throw new Error(
      'Brak ENCRYPTION_KEY/NEXTAUTH_SECRET — nie można szyfrować danych.',
    );
  }
  // Normalizujemy dowolny sekret do 32 bajtów przez SHA-256.
  return createHash('sha256').update(raw).digest();
}

/** Szyfruje tekst jawny. Zwraca string gotowy do zapisania w bazie. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`;
}

/** Odszyfrowuje wartość zapisaną przez `encrypt`. Zwraca null przy błędzie. */
export function decrypt(payload: string): string | null {
  try {
    const [ivB64, tagB64, ctB64] = payload.split('.');
    if (!ivB64 || !tagB64 || !ctB64) return null;
    const decipher = createDecipheriv(
      'aes-256-gcm',
      getKey(),
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const pt = Buffer.concat([
      decipher.update(Buffer.from(ctB64, 'base64')),
      decipher.final(),
    ]);
    return pt.toString('utf8');
  } catch {
    return null;
  }
}
