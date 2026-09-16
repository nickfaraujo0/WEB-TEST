// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC017 — Verify form for student role
 * with valid phone number.
 * Precondition (spreadsheet): mandatory fields should be filled except phone number.
 * Steps (spreadsheet): 1. Enter ten digits.
 * Expected (spreadsheet): Continue button should be enabled.
 *
 * N/A on web (per user decision, 2026-09-14): there is no phone/mobile number field on the
 * real /signup form at all (see TC016), so there is nothing to enter ten digits into. The
 * only enable/disable gating that exists is the one already proven in TC004/TC009 — every
 * text field filled plus the consent checkbox — which this test confirms once more still
 * holds with no phone field involved.
 */
test('TC017 - Verify form for student role with valid phone number (N/A on web)', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  await expect(page.getByPlaceholder(/phone|mobile/i)).toHaveCount(0);

  await signupPage.fill({
    name: 'Test User',
    email: 'unused-tc017@wafer.ee',
    password: 'TestPass@123',
    confirmPassword: 'TestPass@123',
  });
  await signupPage.consentCheckbox.check();

  await expect(signupPage.submitButton).toBeEnabled();
});
