// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC008 — Verify form fields for
 * Professor role.
 * Precondition: none.
 * Steps (spreadsheet): 1. On the form page, change the role dropdown to 'Professor'.
 * 2. Observe the form fields displayed.
 * Expected (spreadsheet): First Name, Last Name, Department (dropdown).
 *
 * N/A on web (per user decision, 2026-09-14): same basis as TC006/TC007 — no role dropdown,
 * so there's no way to switch to a "Professor" state at all. No Department field exists
 * anywhere on the real /signup form either. Confirmed live by text search across the page.
 */
test('TC008 - Verify form fields for Professor role (N/A on web)', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  await expect(page.getByText(/department/i)).toHaveCount(0);
  await expect(page.getByText(/professor/i)).toHaveCount(0);

  // The form is identical for every visitor — no role-dependent field set exists.
  await expect(signupPage.nameInput).toBeVisible();
  await expect(signupPage.emailInput).toBeVisible();
  await expect(signupPage.passwordInput).toBeVisible();
  await expect(signupPage.confirmPasswordInput).toBeVisible();
});
