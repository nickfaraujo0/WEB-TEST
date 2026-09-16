// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';
import { credential } from './credentials.js';

/**
 * Hive Test Cases.xlsx, sheet "Login", TC003 — Invalid Email.
 * Precondition: user is registered.
 * Steps: go to login page -> enter invalid (unregistered) email -> enter valid password ->
 * click 'Login'.
 * Expected (spreadsheet): error message "Invalid email" is displayed.
 * Expected (actual app behavior): the same generic "Login Failed" / "Invalid email or
 * password" dialog as TC002 — the app does not distinguish an unrecognized email from a
 * wrong password, see login-page.js.
 */
test('TC003 - Invalid Email', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.login(credential('HIVE_UNREGISTERED_EMAIL'), credential('HIVE_VALID_PASSWORD'));

  await expect(loginPage.errorDialog).toBeVisible();
  await expect(loginPage.errorDialog).toContainText('Login Failed');
  await expect(loginPage.errorDialog).toContainText('Invalid email or password');

  await expect(page).toHaveURL(/\/login/i);
});
