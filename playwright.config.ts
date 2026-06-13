/**
 * Plik: playwright.config.ts
 * Cel: Konfiguracja testów E2E (Playwright) — uruchamia produkcyjny serwer aplikacji
 *      i wykonuje scenariusze w przeglądarce.
 * Uruchomienie: `npx playwright install` (jednorazowo) + `npm run test:e2e`.
 *      Wymaga ustawionego DATABASE_URL i NEXTAUTH_SECRET oraz danych seed.
 * Zależności: @playwright/test.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.E2E_PORT ?? '3100';
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET ?? 'e2e-secret-e2e-secret-e2e-secret',
      NEXTAUTH_URL: baseURL,
    },
  },
});
