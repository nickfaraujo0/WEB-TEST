// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';
import { credential } from './credentials.js';

/**
 * TC010 — Password Field Masked.
 * Not in Hive Test Cases.xlsx — inferred from the title only (per user, 2026-09-11).
 * Steps: go to login page -> type a password -> verify it's masked -> toggle the
 * show/hide (eye) icon -> verify it becomes visible in plain text.
 * Expected: the password field masks input by default (type="password"), and the
 * antd show/hide toggle (`.ant-input-password-icon`) switches it to plain text on demand.
 */
test('TC010 - Password Field Masked', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  const password = credential('HIVE_VALID_PASSWORD');
  await loginPage.passwordInput.fill(password);

  await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

  const toggle = page.locator('.ant-input-password-icon');
  await toggle.click();

  await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
  await expect(loginPage.passwordInput).toHaveValue(password);

  // Toggling back re-masks it.
  await toggle.click();
  await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
});
