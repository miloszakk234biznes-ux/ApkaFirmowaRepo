/**
 * Plik: app/api/google-calendar/webhook/route.ts
 * Cel: Odbiera powiadomienia push (Google Calendar Push Notifications) i uruchamia
 *      synchronizację przyrostową Google → aplikacja. Endpoint publiczny (Google
 *      nie wysyła cookies) — autentykacja przez nagłówki kanału + opcjonalny token.
 * Zależności: lib/google-calendar.
 *
 * Uwaga: Google wymaga, aby endpoint zwracał 200 szybko. Walidujemy kanał po
 * nagłówku X-Goog-Channel-ID; pełną weryfikację zapewnia nieprzewidywalny
 * identyfikator kanału oraz opcjonalny X-Goog-Channel-Token (GOOGLE_WEBHOOK_TOKEN).
 */
import { NextResponse } from 'next/server';
import { processIncrementalSync } from '@/lib/google-calendar';

export async function POST(req: Request) {
  const channelId = req.headers.get('x-goog-channel-id');
  const resourceState = req.headers.get('x-goog-resource-state');
  const token = req.headers.get('x-goog-channel-token');

  // Opcjonalna weryfikacja tokenu kanału.
  const expectedToken = process.env.GOOGLE_WEBHOOK_TOKEN;
  if (expectedToken && token !== expectedToken) {
    return new NextResponse(null, { status: 401 });
  }

  // Pierwsze powiadomienie po utworzeniu kanału ma stan "sync" — potwierdzamy.
  if (!channelId || resourceState === 'sync') {
    return new NextResponse(null, { status: 200 });
  }

  try {
    await processIncrementalSync(channelId);
  } catch (error) {
    console.error('[google-webhook] Błąd synchronizacji:', error);
    // Zwracamy 200, aby Google nie ponawiał w nieskończoność przy błędach logicznych.
  }
  return new NextResponse(null, { status: 200 });
}
