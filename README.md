# ApkaFirmowa — zarządzanie firmą usługową

Produkcyjna aplikacja webowa (PWA) dla jednoosobowej lub małej firmy usługowej:
kalendarz zleceń, CRM klientów, moduł finansowy, raporty i powiadomienia.

> **Status:** Etap 1 — konfiguracja projektu i autoryzacja. Kolejne moduły
> (kalendarz, CRM, finanse, PWA) są wdrażane etapowo zgodnie ze specyfikacją.

## Stack technologiczny

- **Frontend/Backend:** Next.js 14 (App Router) + TypeScript
- **Baza danych:** PostgreSQL + Prisma ORM
- **Autoryzacja:** NextAuth.js (credentials + JWT, httpOnly cookies)
- **UI:** Tailwind CSS + shadcn/ui, tryb jasny/ciemny
- **Walidacja:** Zod (frontend + backend)
- **E-mail:** nodemailer (reset hasła)

## Wymagania

- Node.js ≥ 20
- PostgreSQL 14+ (lokalnie lub przez Docker)
- npm

## Szybki start (development)

```bash
# 1. Zainstaluj zależności
npm install

# 2. Skonfiguruj zmienne środowiskowe
cp .env.example .env
#   Ustaw co najmniej DATABASE_URL i NEXTAUTH_SECRET
#   Sekret: openssl rand -base64 32

# 3. Uruchom bazę (opcjonalnie przez Docker)
docker compose up -d db

# 4. Migracje + dane demo
npm run prisma:migrate    # tworzy schemat bazy
npm run db:seed           # konta demo (admin + pracownik)

# 5. Start aplikacji
npm run dev
```

Aplikacja: http://localhost:3000

### Konta demonstracyjne (po `npm run db:seed`)

| Rola      | E-mail                        | Hasło            |
| --------- | ----------------------------- | ---------------- |
| Administrator | `admin@apkafirmowa.app`     | `Admin1234!`     |
| Pracownik | `pracownik@apkafirmowa.app`   | `Pracownik1234!` |

## Uruchomienie przez Docker (cała aplikacja + baza)

```bash
cp .env.example .env        # ustaw NEXTAUTH_SECRET
docker compose up --build   # app + PostgreSQL

# jednorazowo: dane demo
docker compose exec app node node_modules/prisma/build/index.js db seed
```

## Skrypty npm

| Skrypt                  | Opis                                          |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Serwer deweloperski                           |
| `npm run build`         | Build produkcyjny (`prisma generate` + Next)  |
| `npm run start`         | Start zbudowanej aplikacji                    |
| `npm run lint`          | ESLint                                        |
| `npm run format`        | Prettier (zapis)                              |
| `npm run prisma:migrate`| Migracje deweloperskie                        |
| `npm run prisma:studio` | Prisma Studio (podgląd bazy)                  |
| `npm run db:seed`       | Dane demonstracyjne                           |

## Zmienne środowiskowe

Pełny opis każdej zmiennej znajduje się w [`.env.example`](./.env.example).
Najważniejsze: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, oraz `SMTP_*`
(opcjonalnie — bez nich e-maile resetu hasła trafiają do logów konsoli).

## Struktura projektu

```
app/
  (auth)/        — logowanie, rejestracja, reset hasła
  (dashboard)/   — chronione trasy (dashboard, kalendarz, zlecenia, klienci, finanse…)
  api/auth/      — rejestracja, reset hasła, handler NextAuth
components/
  ui/            — komponenty bazowe (shadcn/ui)
  shared/        — sidebar, bottom nav, menu użytkownika, przełącznik motywu
lib/             — prisma, auth, rbac, email, tokens, walidacje
prisma/          — schema.prisma + seed.ts
```

## Wdrożenie

Instrukcja krok po kroku (Vercel + Railway oraz Docker/VPS) znajduje się w
[`docs/DEPLOY.md`](./docs/DEPLOY.md).

## Bezpieczeństwo

- Hasła hashowane bcryptem (12 rund)
- RBAC: middleware tras + `lib/rbac.ts` dla API + warstwowe sprawdzenia w RSC
- Walidacja Zod po obu stronach
- Dziennik krytycznych operacji w `AuditLog`
- Tokeny resetu hasła hashowane (w bazie nie ma surowych tokenów)
