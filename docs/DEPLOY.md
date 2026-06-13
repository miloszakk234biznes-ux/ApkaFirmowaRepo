# Wdrożenie produkcyjne

Dokument opisuje dwa scenariusze wdrożenia aplikacji ApkaFirmowa:

1. **Vercel (frontend/SSR) + Railway (PostgreSQL)** — najszybsza ścieżka.
2. **Docker na własnym VPS** — pełna kontrola.

---

## 1. Vercel + Railway

### 1.1. Baza danych na Railway

1. Załóż konto na [railway.app](https://railway.app) i utwórz nowy projekt.
2. Kliknij **New → Database → PostgreSQL**. Railway utworzy instancję.
3. W zakładce bazy → **Connect** skopiuj **Postgres Connection URL**
   (format `postgresql://user:pass@host:port/railway`).
4. Zachowaj ten URL — to wartość `DATABASE_URL`.

> Alternatywa: **Supabase** → Project Settings → Database → Connection string
> (URI). Użyj trybu **Session** (port 5432) dla migracji.

### 1.2. Aplikacja na Vercel

1. Wypchnij repozytorium na GitHub.
2. Na [vercel.com](https://vercel.com) → **Add New → Project** → wybierz repo.
3. Framework preset: **Next.js** (wykrywany automatycznie).
4. W **Environment Variables** dodaj:

   | Zmienna           | Wartość                                                  |
   | ----------------- | -------------------------------------------------------- |
   | `DATABASE_URL`    | connection string z Railway/Supabase                     |
   | `NEXTAUTH_URL`    | `https://twoja-domena.vercel.app` (po pierwszym deployu) |
   | `NEXTAUTH_SECRET` | wynik `openssl rand -base64 32`                          |
   | `SMTP_HOST`       | host SMTP (np. `smtp.resend.com`, opcjonalnie)           |
   | `SMTP_PORT`       | `587`                                                    |
   | `SMTP_USER`       | użytkownik SMTP                                          |
   | `SMTP_PASSWORD`   | hasło/klucz SMTP                                         |
   | `SMTP_FROM`       | `ApkaFirmowa <no-reply@twojadomena.pl>`                  |

5. **Build Command** (Vercel domyślnie `npm run build`) już zawiera
   `prisma generate`. Nie wymaga zmian.
6. Kliknij **Deploy**.

### 1.3. Migracje i seed na produkcji

Migracje najlepiej uruchomić lokalnie wskazując produkcyjny `DATABASE_URL`:

```bash
# Wskaż produkcyjną bazę (ostrożnie!)
export DATABASE_URL="postgresql://...railway..."

npx prisma migrate deploy   # zastosuj migracje
npm run db:seed             # (opcjonalnie) konta demo
```

> Po pierwszym deployu zaktualizuj `NEXTAUTH_URL` na finalną domenę
> i wykonaj **Redeploy**.

### 1.4. Domena własna

Vercel → Project → **Settings → Domains** → dodaj domenę i ustaw rekordy DNS
zgodnie z instrukcją Vercel. Zaktualizuj `NEXTAUTH_URL`.

---

## 2. Docker na VPS (Ubuntu + Nginx + SSL)

### 2.1. Przygotowanie serwera

```bash
# Docker + Compose
curl -fsSL https://get.docker.com | sh
sudo apt-get install -y docker-compose-plugin nginx certbot python3-certbot-nginx
```

### 2.2. Konfiguracja aplikacji

```bash
git clone <repo> apkafirmowa && cd apkafirmowa
cp .env.example .env
# Ustaw: NEXTAUTH_SECRET, NEXTAUTH_URL=https://twojadomena.pl,
#        SMTP_* oraz (opcjonalnie) POSTGRES_PASSWORD.
```

### 2.3. Start

```bash
docker compose up -d --build
# Dane demo (jednorazowo):
docker compose exec app node node_modules/prisma/build/index.js db seed
```

Migracje wykonują się automatycznie przy starcie kontenera
(`prisma migrate deploy` w `CMD` Dockerfile).

### 2.4. Reverse proxy (Nginx) + SSL

`/etc/nginx/sites-available/apkafirmowa`:

```nginx
server {
    server_name twojadomena.pl;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/apkafirmowa /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d twojadomena.pl     # automatyczny certyfikat Let's Encrypt
```

---

## Checklista produkcyjna

- [ ] `NEXTAUTH_SECRET` to losowy ciąg ≥ 32 znaki (inny niż dev).
- [ ] `NEXTAUTH_URL` wskazuje na finalną domenę (https).
- [ ] `DATABASE_URL` wskazuje produkcyjną bazę; migracje zastosowane.
- [ ] SMTP skonfigurowane (reset hasła działa) lub świadomie pominięte.
- [ ] HTTPS aktywne (Vercel automatycznie / Nginx + certbot na VPS).
- [ ] Konta demo usunięte lub hasła zmienione przed udostępnieniem.
