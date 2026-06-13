# Dokumentacja API

Wszystkie endpointy (poza publicznymi auth/webhook) wymagają zalogowania
(NextAuth, cookie sesji). Walidacja: Zod. Autoryzacja: RBAC (`ADMIN`/`EMPLOYEE`).
Format błędów: `{ "error": string, "issues"?: ZodFlattened }`.

Legenda dostępu: 🔓 publiczny · 👤 zalogowany · 👑 tylko ADMIN ·
🔒 RBAC scope (pracownik widzi tylko swoje).

## Autoryzacja

| Metoda | Ścieżka                     | Dostęp | Opis                                      |
| ------ | --------------------------- | ------ | ----------------------------------------- |
| `*`    | `/api/auth/[...nextauth]`   | 🔓     | Handler NextAuth (signin/signout/session) |
| POST   | `/api/auth/register`        | 🔓     | Rejestracja (rate limit 5/min/IP)         |
| POST   | `/api/auth/forgot-password` | 🔓     | Wysyłka linku resetu (rate limit)         |
| POST   | `/api/auth/reset-password`  | 🔓     | Ustawienie nowego hasła (token)           |

## Zlecenia

| Metoda   | Ścieżka                                    | Dostęp | Opis                                                                                            |
| -------- | ------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------- |
| GET      | `/api/orders`                              | 🔒     | Lista (filtry: `q,status,priority,serviceType,assignedUserId,from,to,page,pageSize,sort,order`) |
| POST     | `/api/orders`                              | 🔒     | Utworzenie (klient istniejący lub nowy; auto-sync Google/income)                                |
| GET      | `/api/orders/:id`                          | 🔒     | Szczegóły + historia statusu                                                                    |
| PATCH    | `/api/orders/:id`                          | 🔒     | Edycja (kwoty, termin, status)                                                                  |
| DELETE   | `/api/orders/:id`                          | 🔒     | Usunięcie                                                                                       |
| PATCH    | `/api/orders/:id/status`                   | 🔒     | Szybka zmiana statusu (+ historia)                                                              |
| GET/POST | `/api/orders/:id/attachments`              | 🔒     | Lista / upload (multipart `file`)                                                               |
| DELETE   | `/api/orders/:id/attachments?type=&attId=` | 🔒     | Usuń załącznik                                                                                  |
| GET/POST | `/api/orders/:id/costs`                    | 👑     | Rentowność / dodanie kosztu                                                                     |
| DELETE   | `/api/orders/:id/costs/:costId`            | 👑     | Usuń koszt                                                                                      |

## Klienci (CRM)

| Metoda          | Ścieżka                        | Dostęp | Opis                             |
| --------------- | ------------------------------ | ------ | -------------------------------- |
| GET             | `/api/clients?page=...`        | 👤     | Lista (fulltext `q`, agregaty)   |
| GET             | `/api/clients?q=...`           | 👤     | Autocomplete (`{clients}`)       |
| POST            | `/api/clients`                 | 👤     | Utworzenie (dedupe po telefonie) |
| GET             | `/api/clients/check?phone=`    | 👤     | Detekcja duplikatu               |
| GET/PATCH       | `/api/clients/:id`             | 👤     | Szczegóły+statystyki / edycja    |
| DELETE          | `/api/clients/:id`             | 👑     | Usunięcie                        |
| GET/POST/DELETE | `/api/clients/:id/attachments` | 👤     | Pliki klienta                    |
| GET             | `/api/clients/export?q=`       | 👤     | Export XLSX                      |

## Finanse (👑 ADMIN)

| Metoda       | Ścieżka                | Opis                                     |
| ------------ | ---------------------- | ---------------------------------------- |
| GET/POST     | `/api/expenses`        | Lista (filtry okres/kategoria) / dodanie |
| PATCH/DELETE | `/api/expenses/:id`    | Edycja / usunięcie                       |
| GET/POST     | `/api/incomes`         | Lista / ręczny przychód                  |
| DELETE       | `/api/incomes/:id`     | Usunięcie                                |
| GET/POST     | `/api/goals`           | Lista / upsert celu miesięcznego         |
| GET          | `/api/finance/summary` | KPI, serie M/M, kategorie, cel, alerty   |

## Dokumenty i raporty (👑 ADMIN)

| Metoda   | Ścieżka                                       | Opis                            |
| -------- | --------------------------------------------- | ------------------------------- |
| GET/POST | `/api/invoices`                               | Lista / wystawienie (numeracja) |
| GET      | `/api/invoices/:id/pdf`                       | PDF faktury                     |
| POST     | `/api/invoices/preview`                       | Podgląd PDF bez zapisu          |
| GET      | `/api/reports/finance?year=&format=pdf\|xlsx` | Raport roczny                   |
| GET/PUT  | `/api/company`                                | Dane firmy (GET 👤, PUT 👑)     |

## To-Do, powiadomienia, mapy

| Metoda          | Ścieżka                        | Dostęp  | Opis                                             |
| --------------- | ------------------------------ | ------- | ------------------------------------------------ |
| GET/POST        | `/api/todos`                   | 👤      | Lista (filter/scope) / utworzenie                |
| PATCH/DELETE    | `/api/todos/:id`               | 👤      | Edycja / usunięcie (właściciel/przypisany/admin) |
| GET/POST        | `/api/notifications`           | 👤      | Lista+licznik / oznacz przeczytane               |
| GET/POST/DELETE | `/api/notifications/subscribe` | 👤      | VAPID key / subskrypcja push                     |
| POST            | `/api/cron/reminders`          | 👑/CRON | Przypomnienia (Bearer `CRON_SECRET` lub admin)   |
| POST            | `/api/uploads`                 | 👤      | Generyczny upload pliku                          |
| GET             | `/api/files/:path`             | 👤      | Serwowanie wgranych plików                       |

## Google Calendar (👤, OAuth per użytkownik)

| Metoda      | Ścieżka                           | Opis                                 |
| ----------- | --------------------------------- | ------------------------------------ |
| GET         | `/api/google-calendar/connect`    | Start OAuth (redirect)               |
| GET         | `/api/google-calendar/callback`   | Odbiór kodu (CSRF state)             |
| GET         | `/api/google-calendar/status`     | Stan połączenia                      |
| GET         | `/api/google-calendar/calendars`  | Lista kalendarzy                     |
| POST        | `/api/google-calendar/select`     | Wybór kalendarza                     |
| POST        | `/api/google-calendar/disconnect` | Rozłączenie                          |
| POST        | `/api/google-calendar/resync`     | Ręczna re-synchronizacja zlecenia    |
| POST/DELETE | `/api/google-calendar/watch`      | Push on/off                          |
| POST        | `/api/google-calendar/webhook`    | 🔓 Webhook Google (sync przyrostowa) |

## Kody odpowiedzi

`200` OK · `201` utworzono · `400` walidacja · `401` brak sesji ·
`403` brak uprawnień (RBAC) · `404` nie znaleziono · `409` konflikt (duplikat) ·
`429` rate limit · `503` integracja nieskonfigurowana.
