// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC011 — Verify error for invalid
 * email address.
 * Precondition: none.
 * Steps (spreadsheet): 1. On the email input page, enter an invalid email address. 2. Tap
 * the Continue button. 3. Observe the error message.
 * Expected (spreadsheet): an error message should be displayed for invalid email address.
 *
 * Direct match on web (per user decision, 2026-09-14): reinterpreted onto the real /signup
 * form's own email field. Confirmed live: a malformed email (no '@') is rejected by
 * client-side validation as soon as you try to submit — an antd inline error appears under
 * the field ("Please Enter Email in this Valid Format (abcd@mail.com)") and no request ever
 * reaches the backend, so this is safe to submit (nothing gets created either way).
 */
test('TC011 - Verify error for invalid email address', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  await signupPage.fill({
    name: 'Test User',
    email: 'notanemail',
    password: 'TestPass@123',
    confirmPassword: 'TestPass@123',
  });
  await signupPage.consentCheckbox.check();
  await signupPage.submitButton.click();

  await expect(page.getByText(/please enter email in this valid format/i)).toBeVisible();
  await expect(page).toHaveURL(/\/signup/i);
});
