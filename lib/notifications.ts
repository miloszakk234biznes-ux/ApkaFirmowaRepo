/**
 * Plik: lib/notifications.ts
 * Cel: Tworzenie powiadomień in-app (zapis w bazie) z opcjonalnym pushem (Web Push).
 *      Wykorzystywane przez przypomnienia o zleceniach i alerty.
 * Zależności: lib/prisma, lib/push, @prisma/client.
 */
import { NotificationType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendPushToUser } from '@/lib/push';

/** Tworzy powiadomienie in-app i (jeśli skonfigurowano) wysyła push. */
export async function notifyUser(params: {
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
  url?: string;
  push?: boolean;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type ?? NotificationType.SYSTEM,
      title: params.title,
      message: params.message,
    },
  });
  if (params.push !== false) {
    await sendPushToUser(params.userId, {
      title: params.title,
      message: params.message,
      url: params.url,
    }).catch(() => {});
  }
}
