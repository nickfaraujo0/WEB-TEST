// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';
import { credential } from './credentials.js';

/**
 * TC013 — Enter Key Submits The Login Form.
 * Not in Hive Test Cases.xlsx — inferred from the title only (per user, 2026-09-11).
 * Steps: go to login page -> enter valid email and password -> press Enter in the password
 * field (instead of clicking 'Log in').
 *
 * Originally written (and named) as "Enter Key Does Not Submit", mirroring the Appium suite's
 * TC013 finding on the native app. Confirmed live on web that the mobile finding does NOT
 * carry over: Enter behaves exactly like clicking 'Log in' and submits the form normally — the
 * field's a native input inside a <form> with a type="submit" button, the standard browser
 * Enter-to-submit case. Renamed to match what was actually verified rather than what the
 * mobile suite found, per the project's rule against asserting a title the real behavior
 * contradicts. Standard behavior, working as any user would expect.
 */
test('TC013 - Enter Key Submits The Login Form', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.emailInput.fill(credential('HIVE_VALID_EMAIL'));
  await loginPage.passwordInput.fill(credential('HIVE_VALID_PASSWORD'));
  await loginPage.passwordInput.press('Enter');

  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });
});
