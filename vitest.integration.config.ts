/**
 * Plik: vitest.integration.config.ts
 * Cel: Konfiguracja testów integracyjnych (środowisko node, prawdziwa baza Prisma).
 *      Uruchamiane osobno: `DATABASE_URL=... npm run test:integration`.
 * Zależności: vitest.
 */
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration/**/*.{test,spec}.ts'],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
