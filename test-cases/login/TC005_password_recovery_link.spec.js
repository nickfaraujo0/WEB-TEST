// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';
import { ForgotPasswordPage } from './forgot-password-page.js';
import { credential } from './credentials.js';

/**
 * Hive Test Cases.xlsx, sheet "Login", TC005 — Password Recovery Link.
 * Precondition: user is registered.
 * Steps: go to login page -> click 'Forgot Password' -> enter registered email -> submit.
 * Expected: password reset link is sent to the user's registered email.
 *
 * Scope note: this only verifies the UI's own confirmation ("Reset email sent successfully.").
 * Confirming the email actually arrives in the inbox is outside what browser automation can
 * check and would need a mailbox-access step.
 */
test('TC005 - Password Recovery Link', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.forgotPasswordLink.click();

  await expect(page).toHaveURL(/\/forgotPassword/i);

  const forgotPasswordPage = new ForgotPasswordPage(page);
  await forgotPasswordPage.submit(credential('HIVE_VALID_EMAIL'));

  await expect(forgotPasswordPage.confirmationDialog).toBeVisible();
  await expect(forgotPasswordPage.confirmationDialog).toContainText('Reset email sent successfully');
});
