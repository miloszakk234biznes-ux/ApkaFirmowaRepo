/**
 * Plik: worker/index.ts
 * Cel: Niestandardowy fragment Service Workera (dołączany przez @ducanh2912/next-pwa)
 *      — obsługa Web Push (wyświetlanie powiadomień) oraz kliknięcia w powiadomienie
 *      (otwarcie/aktywacja okna aplikacji).
 * Zależności: brak (środowisko Service Worker).
 */
declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event: PushEvent) => {
  let data: { title?: string; message?: string; url?: string } = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { message: event.data?.text() };
  }

  const title = data.title ?? 'ApkaFirmowa';
  const options: NotificationOptions = {
    body: data.message ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    data: { url: data.url ?? '/dashboard' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url =
    (event.notification.data as { url?: string } | undefined)?.url ??
    '/dashboard';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Aktywuj istniejące okno aplikacji, jeśli otwarte.
        for (const client of clients) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
