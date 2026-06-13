# PWA i tryb offline (Etap 7)

Aplikacja działa jako Progressive Web App — instaluje się na telefonie/komputerze,
działa offline i obsługuje powiadomienia push.

## Co jest zaimplementowane

- **Manifest** (`app/manifest.ts` → `/manifest.webmanifest`): nazwa, `display: standalone`,
  `start_url: /dashboard`, kolory motywu, ikony 72–512 px + maskable.
- **Ikony** (`public/icons/*`) generowane skryptem `node scripts/generate-icons.mjs`
  (sharp) — Android, maskable, `apple-touch-icon`, favicony, splash iOS.
- **Service Worker** (`@ducanh2912/next-pwa`, generowany do `public/sw.js`):
  - cache-first: fonty, ikony, statyki,
  - network-first: API (`/api/orders|clients|finance|expenses|incomes|notifications`),
  - stale-while-revalidate: strony aplikacji.
- **Custom worker** (`worker/index.ts`) — obsługa **Web Push** (`showNotification`)
  i kliknięcia w powiadomienie (`notificationclick` → otwarcie aplikacji).
- **Offline (IndexedDB / Dexie)** — `lib/offline/*`:
  - kolejka rekordów oczekujących (`pending`),
  - `submitWithOfflineFallback` używane w formularzu zlecenia i wydatku — przy
    braku sieci zapis trafia do kolejki,
  - automatyczny **flush po odzyskaniu sieci** + rejestracja **Background Sync**,
  - strategia konfliktów: „last write wins" (`clientUpdatedAt`).
- **Wskaźnik online/offline** + licznik „do synchronizacji" (`components/pwa/pwa-manager.tsx`).
- **Install prompt** (`components/pwa/install-prompt.tsx`) — baner „Dodaj do ekranu
  głównego" (Android `beforeinstallprompt`, instrukcja dla iOS).
- **Push** — włączanie w Ustawieniach (`components/settings/push-card.tsx`):
  prośba o zgodę → subskrypcja przez SW → zapis na serwerze (`/api/notifications/subscribe`).

## Konfiguracja push (VAPID)

```bash
npx web-push generate-vapid-keys
# ustaw w .env:
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@twojadomena.pl"
```

## Uwagi

- Service Worker jest **wyłączony w trybie deweloperskim** (`disable` w
  `next.config.mjs`) — testuj PWA na buildzie produkcyjnym (`npm run build && npm start`)
  pod HTTPS (lub `localhost`).
- Pliki `public/sw.js`, `public/workbox-*.js`, `public/worker-*.js` są generowane
  przy buildzie i wykluczone z gita.

## Audyt Lighthouse

Cel: PWA „installable" + offline. Uruchom w Chrome DevTools → Lighthouse na
produkcyjnym buildzie pod HTTPS. Manifest, Service Worker, ikony i tryb offline
spełniają kryteria instalowalności.
