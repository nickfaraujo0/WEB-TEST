// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC004 — Verify Next button is enabled
 * after college selection.
 * Precondition: none.
 * Steps (spreadsheet): 1. Navigate to the college selection page. 2. Select a college from
 * the dropdown. 3. Observe the state of the Next button.
 * Expected (spreadsheet): Next button should become enabled after a college is selected.
 *
 * Reinterpreted for web (same basis as TC003, per user decision 2026-09-14): no college
 * concept exists, but the direct equivalent is the real gating logic on /signup — the submit
 * button goes from disabled to enabled once every required field is filled and the consent
 * checkbox is ticked. This test does not click submit, so it creates no account.
 */
test('TC004 - Verify submit button is enabled once the sign-up form is complete', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  await expect(signupPage.submitButton).toBeDisabled();

  await signupPage.fill({
    name: 'Test User',
    email: 'unused-tc004@wafer.ee',
    password: 'TestPass@123',
    confirmPassword: 'TestPass@123',
  });
  await signupPage.consentCheckbox.check();

  await expect(signupPage.submitButton).toBeEnabled();
});
