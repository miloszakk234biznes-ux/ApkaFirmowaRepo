/**
 * Plik: tests/e2e/auth-orders.spec.ts
 * Cel: E2E — pełny flow administratora: logowanie → dodanie zlecenia → zmiana
 *      statusu. Korzysta z kont seed (admin@apkafirmowa.app).
 * Zależności: @playwright/test.
 */
import { test, expect } from '@playwright/test';

async function login(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Hasło').fill(password);
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
  await page.waitForURL('**/dashboard');
}

test('admin: logowanie i pulpit', async ({ page }) => {
  await login(page, 'admin@apkafirmowa.app', 'Admin1234!');
  await expect(page.getByText('Witaj')).toBeVisible();
});

test('admin: dodanie zlecenia z listy', async ({ page }) => {
  await login(page, 'admin@apkafirmowa.app', 'Admin1234!');
  await page.goto('/orders');
  await page.getByRole('button', { name: 'Nowe' }).first().click();

  await page.getByLabel('Tytuł zlecenia *').fill('E2E Sprzątanie');
  await page.getByLabel('Imię klienta').fill('Test');
  await page.getByLabel('Nazwisko klienta').fill('E2E');
  await page.getByLabel('Kwota brutto (zł)').fill('400');
  await page.getByRole('button', { name: 'Utwórz zlecenie' }).click();

  await expect(page.getByText('E2E Sprzątanie')).toBeVisible({
    timeout: 10_000,
  });
});

test('logowanie błędnym hasłem pokazuje błąd', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('admin@apkafirmowa.app');
  await page.getByLabel('Hasło').fill('zleHaslo123');
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
  await expect(page.getByText(/Nieprawidłowy/i)).toBeVisible();
});
