// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';
import { credential } from './credentials.js';

/**
 * TC013 — Enter Key Does Not Submit.
 * Not in Hive Test Cases.xlsx — inferred from the title only (per user, 2026-09-11).
 * Steps: go to login page -> enter valid email and password -> press Enter in the password
 * field (instead of clicking 'Log in').
 *
 * Expected (from the title): nothing happens — Enter has no effect on the form.
 * Expected (actual app behavior — the title does not hold): Enter behaves exactly like
 * clicking 'Log in' and submits the form normally. A first pass at this test manually drove
 * the page with a different automation tool and appeared to show Enter doing nothing; running
 * it for real through Playwright (the actual deliverable, and the more faithful simulation of
 * a real keyboard-driven form submission) contradicted that — the field's a native input
 * inside a <form> with a type="submit" button, which is exactly the standard browser
 * Enter-to-submit case. So this is the good-news case: standard behavior, working as any
 * user would expect.
 */
test('TC013 - Enter Key Does Not Submit', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.emailInput.fill(credential('HIVE_VALID_EMAIL'));
  await loginPage.passwordInput.fill(credential('HIVE_VALID_PASSWORD'));
  await loginPage.passwordInput.press('Enter');

  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });
});
