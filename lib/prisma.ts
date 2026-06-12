/**
 * Plik: lib/prisma.ts
 * Cel: Pojedyncza, współdzielona instancja Prisma Client (singleton),
 *      aby uniknąć wyczerpania puli połączeń w trybie dev (hot reload).
 * Zależności: @prisma/client.
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
