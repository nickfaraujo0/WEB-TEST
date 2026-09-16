// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC016 — Verify form fields for
 * Student role.
 * Precondition: none.
 * Steps (spreadsheet): 1. On the form page, ensure the role dropdown is set to 'Student'.
 * 2. Observe the form fields displayed.
 * Expected (spreadsheet): First Name, Last Name, Mobile Number, Degree (dropdown), Branch
 * (dropdown), Year of Joining (dropdown), Roll Number.
 *
 * N/A on web (per user decision, 2026-09-14) — a duplicate of TC007 with a Mobile Number
 * field added to the expected list. Same basis as TC006/TC007/TC008: no role concept exists,
 * and confirmed live (again) that the real /signup form's field set is unchanged: Full Name,
 * Email, Password, Confirm Password, consent checkbox. No mobile/phone field, and no "phone",
 * "mobile", or "number" text anywhere on the page.
 */
test('TC016 - Verify form fields for Student role incl. Mobile Number (N/A on web)', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  for (const label of ['Mobile Number', 'Degree', 'Branch', 'Year of Joining', 'Roll Number', 'First Name', 'Last Name']) {
    await expect(page.getByText(label, { exact: false })).toHaveCount(0);
  }

  await expect(signupPage.nameInput).toBeVisible();
  await expect(signupPage.emailInput).toBeVisible();
  await expect(signupPage.passwordInput).toBeVisible();
  await expect(signupPage.confirmPasswordInput).toBeVisible();
});
