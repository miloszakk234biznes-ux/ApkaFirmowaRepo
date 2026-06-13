/**
 * Plik: vitest.config.ts
 * Cel: Konfiguracja Vitest — środowisko jsdom (testy komponentów), globalne API
 *      testowe, alias `@` do katalogu projektu oraz plik setup (jest-dom).
 * Zależności: vitest, @vitejs/plugin-react.
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    // Testy integracyjne (DB) i E2E uruchamiane osobno.
    exclude: ['tests/e2e/**', 'tests/integration/**', 'node_modules/**'],
  },
});
