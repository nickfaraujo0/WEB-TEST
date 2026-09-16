// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';
import { credential } from './credentials.js';

/**
 * TC012 — Whitespace-Padded Email Login.
 * Not in Hive Test Cases.xlsx — inferred from the title only (per user, 2026-09-11).
 * Steps: go to login page -> enter the valid registered email padded with leading and
 * trailing spaces -> enter the valid password -> click 'Login'.
 *
 * Expected (reasonable assumption from the title): login succeeds the same as with an
 * untrimmed email, since padding a field with whitespace is a common accidental user
 * action apps are expected to tolerate.
 *
 * Expected (actual app behavior — a real bug, confirmed live before writing this test): the
 * email input visibly trims the padding once you tab away from it (onBlur), but the value
 * actually submitted still carries the whitespace — Firebase rejects it with
 * `auth/invalid-email` and the app shows the same generic "Login Failed" / "Login failed.
 * Please try again" dialog as TC004/TC007. So despite what the field displays, a
 * whitespace-padded email currently CANNOT log in.
 */
test('TC012 - Whitespace-Padded Email Login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  const paddedEmail = `  ${credential('HIVE_VALID_EMAIL')}  `;
  await loginPage.login(paddedEmail, credential('HIVE_VALID_PASSWORD'));

  await expect(loginPage.errorDialog).toBeVisible();
  await expect(loginPage.errorDialog).toContainText('Login Failed');
  await expect(loginPage.errorDialog).toContainText('Login failed. Please try again');

  await expect(page).toHaveURL(/\/login/i);
});
