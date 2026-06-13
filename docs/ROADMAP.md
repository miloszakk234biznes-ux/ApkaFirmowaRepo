# Roadmap — propozycje dalszego rozwoju

Aplikacja realizuje pełny zakres Etapów 1–8. Poniżej kierunki rozwoju.

## Bezpieczeństwo i niezawodność

- **CSP z nonce'ami** zamiast `'unsafe-inline'/'unsafe-eval'` (middleware generujący nonce per request).
- **Rate limiting rozproszony** — podmiana `lib/rate-limit.ts` na Upstash Redis dla wielu instancji.
- **2FA / TOTP** dla administratorów.
- **Sentry** (`@sentry/nextjs`) — error tracking front + back; źródłomapy.
- **Testy obciążeniowe** (k6) krytycznych endpointów.

## Integracje

- **Logowanie Google OAuth** (modele NextAuth już w schemacie).
- **Płatności online** (Stripe/Przelewy24) + automatyczne oznaczanie opłacenia.
- **e-Faktura / KSeF** — eksport do krajowego systemu e-faktur.
- **Księgowość** — eksport do wFirma/iFirma/Comarch.
- **WhatsApp / SMS dwukierunkowe** potwierdzenia wizyt.

## Funkcjonalności

- **Grafik pracowników** i przydział zleceń wg dostępności.
- **Oferty/wyceny** → konwersja do zlecenia → faktura.
- **Magazyn / materiały** z odpisywaniem przy realizacji.
- **Podpis klienta** (canvas) na protokole odbioru.
- **Geolokalizacja pracownika** i automatyczne wyliczanie tras/dojazdu.
- **Raporty zaawansowane** — rentowność per pracownik/usługa/klient, prognozy.

## UX / PWA

- **Tryb offline dla edycji** (obecnie offline obejmuje tworzenie zleceń/wydatków).
- **Powiadomienia rich push** z akcjami (potwierdź/odłóż).
- **i18n** (PL/EN) i wielowalutowość.
- **Widżety pulpitu** konfigurowalne przez użytkownika.

## Architektura

- **Kolejka zadań** (BullMQ/Redis) dla synchronizacji Google, e-maili, SMS i raportów.
- **Webhooki wychodzące** dla integracji zewnętrznych.
- **Wielofirmowość (multi-tenant)** — obsługa wielu firm na jednej instancji.
- **Audyt rozszerzony** + eksport logów (SIEM).
