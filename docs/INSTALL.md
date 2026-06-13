# Instalacja na własnym serwerze (VPS Ubuntu + Docker + Nginx + SSL)

Przewodnik wdrożenia produkcyjnego na własnym serwerze. Wariant chmurowy
(Vercel + Railway) opisuje [`DEPLOY.md`](./DEPLOY.md).

## 1. Wymagania serwera

- Ubuntu 22.04+ (2 vCPU / 2 GB RAM wystarczą na start)
- Domena wskazująca na IP serwera (rekord A)
- Otwarte porty 80/443

## 2. Instalacja zależności

```bash
curl -fsSL https://get.docker.com | sh
sudo apt-get install -y docker-compose-plugin nginx certbot python3-certbot-nginx
```

## 3. Pobranie i konfiguracja

```bash
git clone <repo-url> apkafirmowa && cd apkafirmowa
cp .env.example .env
```

Uzupełnij w `.env` co najmniej:

| Zmienna             | Opis                                                   |
| ------------------- | ------------------------------------------------------ |
| `NEXTAUTH_SECRET`   | `openssl rand -base64 32`                              |
| `NEXTAUTH_URL`      | `https://twojadomena.pl`                               |
| `ENCRYPTION_KEY`    | `openssl rand -base64 32` (szyfrowanie tokenów Google) |
| `POSTGRES_PASSWORD` | silne hasło bazy                                       |
| `SMTP_*`            | konfiguracja e-mail (reset hasła, przypomnienia)       |

Integracje opcjonalne: `GOOGLE_CLIENT_ID/SECRET` (kalendarz), `VAPID_*` (push),
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (mapy), `TWILIO_*` (SMS).

## 4. Uruchomienie

```bash
docker compose up -d --build
# dane demonstracyjne (jednorazowo):
docker compose exec app node node_modules/prisma/build/index.js db seed
```

Migracje wykonują się automatycznie przy starcie kontenera
(`prisma migrate deploy` w `CMD` Dockerfile). Aplikacja słucha na `127.0.0.1:3000`.

## 5. Reverse proxy + HTTPS (Nginx + Let's Encrypt)

`/etc/nginx/sites-available/apkafirmowa`:

```nginx
server {
    server_name twojadomena.pl;
    client_max_body_size 10M; # uploady plików

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
sudo certbot --nginx -d twojadomena.pl
```

> HTTPS jest wymagany do działania PWA (Service Worker) i Web Push.

## 6. Wolumen na uploady

Pliki (zdjęcia, paragony, dokumenty) zapisują się w `public/uploads`. W
`docker-compose.yml` zamontuj wolumen na ten katalog, aby przetrwały restart:

```yaml
  app:
    volumes:
      - uploads:/app/public/uploads
volumes:
  uploads:
```

## 7. Kopie zapasowe bazy

Codzienny `pg_dump` z rotacją (`scripts/backup.sh`):

```bash
# crontab -e
0 3 * * * cd /sciezka/apkafirmowa && DATABASE_URL="postgresql://postgres:HASLO@localhost:5432/apkafirmowa" \
  BACKUP_DIR=/var/backups/apkafirmowa ./scripts/backup.sh >> /var/log/apka-backup.log 2>&1
```

Opcjonalnie wysyłka do S3: ustaw `BACKUP_S3_BUCKET` i zainstaluj `awscli`.

## 8. Monitoring i logi

- **Logi aplikacji**: strukturalne (Pino, `lib/logger.ts`) → `docker compose logs -f app`.
- **Uptime**: skonfiguruj zewnętrzny monitor (UptimeRobot / Better Uptime) na
  `https://twojadomena.pl/login`.
- **Błędy (Sentry)**: opcjonalnie dodaj `@sentry/nextjs` i `SENTRY_DSN` —
  patrz [`ROADMAP.md`](./ROADMAP.md).
- **Przypomnienia (cron)**: codzienne wywołanie zadania powiadomień:
  ```bash
  0 7 * * * curl -s -X POST https://twojadomena.pl/api/cron/reminders \
    -H "Authorization: Bearer ${CRON_SECRET}"
  ```

## 9. Aktualizacja

```bash
git pull
docker compose up -d --build   # migracje zastosują się automatycznie
```

## 10. Hardening (checklist)

- [ ] HTTPS aktywne, HSTS w odpowiedziach (wbudowane w `next.config.mjs`).
- [ ] `NEXTAUTH_SECRET` i `ENCRYPTION_KEY` losowe, różne od dev.
- [ ] Konta demo usunięte lub z nowymi hasłami.
- [ ] Backup `pg_dump` w cronie i przetestowany odtwarzaniem.
- [ ] Zapora (ufw): otwarte tylko 22/80/443.
- [ ] Rate limiting aktywny (wbudowany, in-memory) — przy wielu instancjach
      podmień `lib/rate-limit.ts` na Upstash Redis.
