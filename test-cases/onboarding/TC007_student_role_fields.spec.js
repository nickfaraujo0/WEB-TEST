// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC007 — Verify form fields for
 * Student role.
 * Precondition: none.
 * Steps (spreadsheet): 1. On the form page, ensure the role dropdown is set to 'Student'.
 * 2. Observe the form fields displayed.
 * Expected (spreadsheet): First Name, Last Name, Degree (dropdown), Branch (dropdown), Year
 * of Joining (dropdown), Roll Number.
 *
 * N/A on web (per user decision, 2026-09-14): no role concept exists at all (see TC006), so
 * there's no "Student" state to observe fields for. The real /signup form has a single fixed
 * field set for everyone: Full Name (not split First/Last), Email, Password, Confirm
 * Password. None of Degree, Branch, Year of Joining, or Roll Number exist. Confirmed live by
 * text search across the whole page.
 */
test('TC007 - Verify form fields for Student role (N/A on web)', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  // The spreadsheet's Student-specific fields are absent.
  for (const label of ['Degree', 'Branch', 'Year of Joining', 'Roll Number', 'First Name', 'Last Name']) {
    await expect(page.getByText(label, { exact: false })).toHaveCount(0);
  }

  // What actually exists instead: one fixed field set, same for every visitor.
  await expect(signupPage.nameInput).toBeVisible();
  await expect(signupPage.emailInput).toBeVisible();
  await expect(signupPage.passwordInput).toBeVisible();
  await expect(signupPage.confirmPasswordInput).toBeVisible();
});
