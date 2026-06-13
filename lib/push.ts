/**
 * Plik: lib/push.ts
 * Cel: Web Push (VAPID) — konfiguracja i wysyłka powiadomień push do subskrypcji
 *      zapisanych w bazie. Service Worker rejestrujący subskrypcje powstaje w
 *      Etapie 7; tutaj jest gotowa warstwa serwerowa.
 * Zależności: web-push, lib/prisma.
 *
 * Konfiguracja: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (generacja:
 *   npx web-push generate-vapid-keys), VAPID_SUBJECT (mailto:...).
 */
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

let configured = false;

export function isPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

function ensureConfigured(): boolean {
  if (!isPushConfigured()) return false;
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? 'mailto:admin@apkafirmowa.app',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
    configured = true;
  }
  return true;
}

/** Wysyła powiadomienie push do wszystkich subskrypcji użytkownika. */
export async function sendPushToUser(
  userId: string,
  payload: { title: string; message: string; url?: string },
): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err) {
        // 404/410 → subskrypcja wygasła, usuwamy.
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription
            .delete({ where: { id: s.id } })
            .catch(() => {});
        }
      }
    }),
  );
}
