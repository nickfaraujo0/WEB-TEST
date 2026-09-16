// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC003 — Verify Next button is
 * disabled when no college is selected.
 * Precondition: none.
 * Steps (spreadsheet): 1. Navigate to the college selection page. 2. Do not select any
 * college. 3. Observe the state of the Next button.
 * Expected (spreadsheet): Next button should remain disabled until a college is selected.
 *
 * Reinterpreted for web (per user decision, 2026-09-14): there is no college-selection step
 * or "Next" button on web — the real /signup page is one step with one submit button. The
 * underlying intent (a gatekeeping button that won't let the user proceed with incomplete
 * input) does have a direct match here though: the submit button is disabled until every
 * required field is filled AND the consent checkbox is ticked — confirmed live before
 * writing this test.
 */
test('TC003 - Verify submit button is disabled when the sign-up form is empty', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  // Nothing filled in at all.
  await expect(signupPage.submitButton).toBeDisabled();

  // All text fields filled, but consent checkbox left unchecked.
  await signupPage.fill({
    name: 'Test User',
    email: 'unused-tc003@wafer.ee',
    password: 'TestPass@123',
    confirmPassword: 'TestPass@123',
  });
  await expect(signupPage.submitButton).toBeDisabled();
});
