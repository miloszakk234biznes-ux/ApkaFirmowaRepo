/**
 * Plik: lib/rate-limit.ts
 * Cel: Prosty limiter zapytań w pamięci (sliding window) — ochrona endpointów
 *      logowania/rejestracji/resetu przed brute-force. W środowisku wielo-
 *      instancyjnym należy podmienić na Upstash Redis (interfejs bez zmian).
 * Zależności: brak.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Sprawdza limit dla klucza. Domyślnie 5 prób na 60 sekund.
 * Zwraca `success: false` po przekroczeniu limitu.
 */
export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  bucket.count += 1;
  const success = bucket.count <= limit;
  return {
    success,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/** Wyciąga identyfikator klienta (IP) z nagłówków żądania. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

// Okresowe czyszczenie wygasłych wpisów (zapobiega wyciekowi pamięci).
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) {
      if (b.resetAt < now) buckets.delete(key);
    }
  }, 300_000).unref?.();
}
