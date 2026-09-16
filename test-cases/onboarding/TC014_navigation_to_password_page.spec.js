// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC014 — Verify navigation to password
 * setup page.
 * Precondition: none.
 * Steps (spreadsheet): 1. Enter a valid and unique email address. 2. Tap the Continue
 * button. 3. Observe the navigation.
 * Expected (spreadsheet): user should be navigated to the password setup page.
 *
 * N/A on web (per user decision, 2026-09-14): same basis as TC010 — there is no separate
 * "password setup page". Both the password and confirm-password fields already live on the
 * same single /signup screen. This test documents that directly without submitting the form
 * (an actual successful submission with a unique email would create a real account — see
 * TC015).
 */
test('TC014 - Verify navigation to password setup page (N/A on web)', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  // Password setup is already visible on the very first (and only) screen.
  await expect(signupPage.passwordInput).toBeVisible();
  await expect(signupPage.confirmPasswordInput).toBeVisible();
});
