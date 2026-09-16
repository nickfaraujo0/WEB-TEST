// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC010 — Verify navigation to email
 * input page.
 * Precondition: none.
 * Steps (spreadsheet): 1. Fill all mandatory fields on the form page. 2. Tap the Continue
 * button. 3. Observe the navigation.
 * Expected (spreadsheet): user should be navigated to the email input page.
 *
 * N/A on web (per user decision, 2026-09-14): there is no separate "email input page" — the
 * email field already lives on the same single screen as every other field. This test
 * documents that directly rather than attempting a submission (a real, successful submission
 * would create an account — see TC015 for why that's out of scope for this pass).
 */
test('TC010 - Verify navigation to email input page (N/A on web)', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  // The email field is already visible on the very first (and only) screen — there is
  // nothing to "navigate to".
  await expect(signupPage.nameInput).toBeVisible();
  await expect(signupPage.emailInput).toBeVisible();
});
