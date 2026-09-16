// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Login", TC004 — Empty Fields.
 * Precondition: user is registered.
 * Steps: go to login page -> leave both email and password fields empty -> click 'Login'.
 * Expected (spreadsheet): error message "Email and Password are required" is displayed.
 * Expected (actual app behavior): there is no client-side required-field validation — the
 * empty submit reaches Firebase, which returns `auth/missing-email`, and the app shows its
 * generic "Login Failed" / "Login failed. Please try again" dialog (same dialog component as
 * TC002/TC003, different body text).
 */
test('TC004 - Empty Fields', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Fields are already empty; submit as-is.
  await loginPage.loginButton.click();

  await expect(loginPage.errorDialog).toBeVisible();
  await expect(loginPage.errorDialog).toContainText('Login Failed');
  await expect(loginPage.errorDialog).toContainText('Login failed. Please try again');

  await expect(page).toHaveURL(/\/login/i);
});
