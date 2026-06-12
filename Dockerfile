# Plik: Dockerfile
# Cel: Wieloetapowy obraz produkcyjny aplikacji Next.js (output: standalone).
# Zależności: Node 20 (alpine), Prisma, OpenSSL.

# ── Etap 1: instalacja zależności ──────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ── Etap 2: build aplikacji ────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generujemy Prisma Client i budujemy Next.js (tryb standalone).
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Etap 3: obraz runtime ──────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Użytkownik nieuprzywilejowany.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Artefakty trybu standalone.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma (schema + engine + CLI) potrzebne do migracji przy starcie.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Migracje uruchamiamy przy starcie kontenera, następnie serwer.
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
