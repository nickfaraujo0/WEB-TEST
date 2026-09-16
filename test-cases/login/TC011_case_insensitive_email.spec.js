// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';
import { credential } from './credentials.js';

/**
 * TC011 — Case-Insensitive Email Login.
 * Not in Hive Test Cases.xlsx — inferred from the title only (per user, 2026-09-11).
 * Steps: go to login page -> enter the valid registered email in uppercase -> enter the
 * valid password -> click 'Login'.
 * Expected: login succeeds the same as with the email's normal case (Firebase Auth treats
 * email addresses as case-insensitive) — confirmed live before writing this test.
 */
test('TC011 - Case-Insensitive Email Login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  const upperCaseEmail = credential('HIVE_VALID_EMAIL').toUpperCase();
  await loginPage.login(upperCaseEmail, credential('HIVE_VALID_PASSWORD'));

  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });
});
