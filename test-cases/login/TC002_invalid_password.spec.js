// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';
import { credential } from './credentials.js';

/**
 * Hive Test Cases.xlsx, sheet "Login", TC002 — Invalid Password.
 * Precondition: user is registered.
 * Steps: go to login page -> enter valid email -> enter invalid password -> click 'Login'.
 * Expected (spreadsheet): error message "Invalid credentials" is displayed.
 * Expected (actual app behavior): an "Login Failed" / "Invalid email or password" dialog —
 * see login-page.js for why this differs from the spreadsheet's wording.
 */
test('TC002 - Invalid Password', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_INVALID_PASSWORD'));

  await expect(loginPage.errorDialog).toBeVisible();
  await expect(loginPage.errorDialog).toContainText('Login Failed');
  await expect(loginPage.errorDialog).toContainText('Invalid email or password');

  // The user stays on the login page rather than being let in.
  await expect(page).toHaveURL(/\/login/i);
});
