# Integracja z Google Calendar (Etap 3)

Aplikacja synchronizuje zlecenia z Google Calendar użytkownika: tworzy event
przy nowym zleceniu, aktualizuje przy edycji/zmianie terminu, usuwa przy
anulowaniu. Opcjonalnie (push notifications) zmiany z Google wracają do
aplikacji (synchronizacja dwukierunkowa).

## 1. Utworzenie projektu i danych OAuth w Google Cloud

1. Wejdź na [console.cloud.google.com](https://console.cloud.google.com/) i
   utwórz nowy projekt (lub wybierz istniejący).
2. **APIs & Services → Library** → wyszukaj **Google Calendar API** → **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External** (lub Internal dla Google Workspace).
   - Uzupełnij nazwę aplikacji, e-mail wsparcia, dane kontaktowe.
   - **Scopes** → dodaj:
     - `.../auth/calendar`
     - `.../auth/calendar.events`
   - W trybie testowym dodaj swoje konto(a) w sekcji **Test users**.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized redirect URIs** → dodaj dokładnie:
     ```
     http://localhost:3000/api/google-calendar/callback        (dev)
     https://twojadomena.pl/api/google-calendar/callback        (prod)
     ```
   - Zapisz **Client ID** i **Client secret**.

## 2. Zmienne środowiskowe

Dodaj do `.env` (opis w `.env.example`):

```bash
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALENDAR_TIMEZONE="Europe/Warsaw"   # opcjonalnie
ENCRYPTION_KEY="$(openssl rand -base64 32)" # szyfrowanie refresh tokenu
GOOGLE_WEBHOOK_TOKEN="$(openssl rand -hex 16)" # opcjonalnie, weryfikacja webhooka
```

> `NEXTAUTH_URL` musi wskazywać publiczny adres aplikacji — z niego budowany jest
> redirect URI oraz adres webhooka.

## 3. Połączenie konta (w aplikacji)

1. Zaloguj się i wejdź w **Ustawienia**.
2. Karta **Google Calendar → Połącz konto Google** → zaakceptuj zgody.
3. Po powrocie wybierz **kalendarz docelowy** (domyślnie „primary").
4. Od teraz nowe/edytowane zlecenia z terminem są automatycznie wysyłane do
   Google. Status synchronizacji widać na stronie szczegółów zlecenia (z
   przyciskiem **Synchronizuj** do ponowienia).

## 4. Synchronizacja dwukierunkowa (push notifications)

Wymaga **publicznego HTTPS** (Google nie wysyła powiadomień na `localhost`).

1. Wdróż aplikację pod publiczną domeną (HTTPS).
2. W **Ustawieniach → Google Calendar** kliknij **Włącz** przy „Synchronizacja
   dwukierunkowa". Aplikacja zarejestruje kanał `events.watch` z adresem
   `{NEXTAUTH_URL}/api/google-calendar/webhook`.
3. Zmiany w Google (przesunięcie terminu, usunięcie eventu) będą aktualizować
   zlecenia (`scheduledAt`, status `CANCELLED`).

> Kanały push Google wygasają (maks. ~7 dni). W środowisku produkcyjnym warto
> dodać zadanie cron odświeżające `watch` (np. raz na dobę) — endpoint
> `POST /api/google-calendar/watch` ponawia rejestrację.

## 5. Bezpieczeństwo

- **Refresh token** jest szyfrowany (AES-256-GCM, `lib/crypto.ts`) przed zapisem
  w bazie — w `GoogleCalendarConnection.refreshTokenEnc` nie ma wartości jawnej.
- Access token jest automatycznie odświeżany i utrwalany.
- Webhook weryfikuje nieprzewidywalny `X-Goog-Channel-ID` oraz opcjonalny
  `X-Goog-Channel-Token` (`GOOGLE_WEBHOOK_TOKEN`).
- Synchronizacja zlecenia trafia do kalendarza **przypisanego pracownika**
  (a gdy brak — osoby wykonującej akcję), więc każdy widzi swoje wizyty.

## 6. Rozwiązywanie problemów

| Objaw                                 | Przyczyna / rozwiązanie                                                |
| ------------------------------------- | ---------------------------------------------------------------------- |
| „Integracja nie jest skonfigurowana"  | Brak `GOOGLE_CLIENT_ID`/`SECRET` w env.                                |
| `redirect_uri_mismatch`               | Redirect URI w Google ≠ `{NEXTAUTH_URL}/api/google-calendar/callback`. |
| Brak refresh tokenu po połączeniu     | Połącz ponownie — używamy `prompt=consent`, by go wymusić.             |
| Push nie działa                       | Wymaga publicznego HTTPS; sprawdź adres webhooka i logi.               |
| Status zlecenia „Błąd synchronizacji" | Szczegóły w `googleSyncError`; użyj **Synchronizuj** po naprawie.      |
