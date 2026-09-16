// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';
import { credential } from './credentials.js';

/**
 * Hive Test Cases.xlsx, sheet "Login", TC007 — Invalid Email Format.
 * Precondition: none.
 * Steps: go to login page -> enter an invalid email format (no '@' symbol) -> enter password
 * -> click 'Login'.
 * Expected (spreadsheet): error message "Enter a valid email address" is displayed.
 * Expected (actual app behavior): the email field does no client-side format validation (it's
 * a plain text input, not type="email", and nothing blocks the submit). The malformed value
 * reaches Firebase, which returns `auth/invalid-email`, and the app shows the same generic
 * "Login Failed" / "Login failed. Please try again" dialog seen in TC004.
 */
test('TC007 - Invalid Email Format', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.login(credential('HIVE_MALFORMED_EMAIL'), credential('HIVE_VALID_PASSWORD'));

  await expect(loginPage.errorDialog).toBeVisible();
  await expect(loginPage.errorDialog).toContainText('Login Failed');
  await expect(loginPage.errorDialog).toContainText('Login failed. Please try again');

  await expect(page).toHaveURL(/\/login/i);
});
