// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC018 — Verify form for student role
 * with invalid phone number.
 * Precondition (spreadsheet): mandatory fields should be filled except phone number.
 * Steps (spreadsheet): 1. Enter either less than 10 digits or other than numbers.
 * Expected (spreadsheet): Continue button should not be enabled.
 *
 * N/A in the sense the spreadsheet meant it — there is no phone/mobile number field on the
 * real /signup form (see TC016/TC017), so there is no phone-format validation to trigger.
 *
 * But adapting the underlying intent ("is there a mandatory field this button's enabled
 * state doesn't actually require?") surfaced a real, reproducible bug, confirmed live before
 * writing this test: filling Name, Password, and Confirm Password, checking consent, and
 * leaving Email completely EMPTY still enables the submit button. TC009 never isolated this
 * because every prior test filled email alongside the other fields — email's own presence
 * was never actually exercised as a gate. So the button's "all mandatory fields filled"
 * check has a real gap: email isn't one of the fields it checks for presence (its *format*
 * is separately validated in TC011, but only once something is typed there at all).
 */
test('TC018 - Verify submit button enables even with Email left completely empty (bug)', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  await expect(page.getByPlaceholder(/phone|mobile/i)).toHaveCount(0);

  await signupPage.fill({
    name: 'Test User',
    password: 'TestPass@123',
    confirmPassword: 'TestPass@123',
  });
  await signupPage.consentCheckbox.check();

  await expect(signupPage.emailInput).toHaveValue('');
  await expect(signupPage.submitButton).toBeEnabled();
});
