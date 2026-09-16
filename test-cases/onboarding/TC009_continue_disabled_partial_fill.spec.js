// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC009 — Verify Continue button is
 * disabled until form fields are filled.
 * Precondition: none.
 * Steps (spreadsheet): 1. On the form page, leave some mandatory fields empty. 2. Observe
 * the state of the Continue button.
 * Expected (spreadsheet): Continue button should remain disabled until all mandatory fields
 * are filled.
 *
 * Direct match on web (per user decision, 2026-09-14): unlike TC006/007/008, this one maps
 * straight onto the real /signup form's own submit button — no reinterpretation needed
 * beyond "Continue" -> the real button (labelled "Sign in"). This goes further than
 * TC003/TC004 (which only checked the fully-empty and fully-complete extremes) by checking
 * every partially-filled state in between stays disabled too.
 */
test('TC009 - Verify submit button stays disabled while any mandatory field is missing', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  await expect(signupPage.submitButton).toBeDisabled();

  await signupPage.nameInput.fill('Test User');
  await expect(signupPage.submitButton).toBeDisabled();

  await signupPage.emailInput.fill('unused-tc009@wafer.ee');
  await expect(signupPage.submitButton).toBeDisabled();

  await signupPage.passwordInput.fill('TestPass@123');
  await expect(signupPage.submitButton).toBeDisabled();

  await signupPage.confirmPasswordInput.fill('TestPass@123');
  // All text fields filled, but the consent checkbox is still unticked.
  await expect(signupPage.submitButton).toBeDisabled();

  await signupPage.consentCheckbox.check();
  await expect(signupPage.submitButton).toBeEnabled();
});
