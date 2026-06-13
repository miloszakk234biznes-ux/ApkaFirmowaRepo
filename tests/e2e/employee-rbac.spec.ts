/**
 * Plik: tests/e2e/employee-rbac.spec.ts
 * Cel: E2E — flow pracownika: logowanie, dostęp do własnych zleceń oraz brak
 *      dostępu do finansów (RBAC: przekierowanie na pulpit).
 * Zależności: @playwright/test.
 */
import { test, expect } from '@playwright/test';

test('pracownik nie ma dostępu do finansów (redirect)', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('pracownik@apkafirmowa.app');
  await page.getByLabel('Hasło').fill('Pracownik1234!');
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
  await page.waitForURL('**/dashboard');

  // Próba wejścia na finanse → przekierowanie na pulpit.
  await page.goto('/finances');
  await page.waitForURL('**/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
});

test('pracownik widzi kalendarz', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('pracownik@apkafirmowa.app');
  await page.getByLabel('Hasło').fill('Pracownik1234!');
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
  await page.waitForURL('**/dashboard');

  await page.goto('/calendar');
  await expect(page.getByText('Kalendarz')).toBeVisible();
});
