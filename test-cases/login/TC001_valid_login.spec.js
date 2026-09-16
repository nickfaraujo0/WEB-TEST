// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';
import { credential } from './credentials.js';

/**
 * Hive Test Cases.xlsx, sheet "Login", TC001 — Valid Login.
 * Precondition: user is registered.
 * Steps: go to login page -> enter valid email -> enter valid password -> click 'Login'.
 * Expected: user is logged in successfully.
 */
test('TC001 - Valid Login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));

  // A successful login redirects off /login into the signed-in app shell (the Buzz feed).
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });
});
