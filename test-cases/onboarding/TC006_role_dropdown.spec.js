// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC006 — Verify role selection
 * dropdown on the form page.
 * Precondition: none.
 * Steps (spreadsheet): 1. Navigate to the form page. 2. Observe the role dropdown options.
 * Expected (spreadsheet): role dropdown should be displayed with options 'Student' (default)
 * and 'Professor'.
 *
 * N/A on web (per user decision, 2026-09-14): there is no "form page" separate from the
 * single-step /signup page, and no role concept at all. Confirmed live: zero <select>
 * elements on the page, and no "student"/"professor"/"role" text anywhere in its content.
 * This test documents that absence rather than skip outright, so it fails loudly (as a
 * prompt to revisit this file) if a role dropdown is ever added.
 */
test('TC006 - Verify role selection dropdown on the form page (N/A on web)', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  await expect(page.locator('select')).toHaveCount(0);
  await expect(page.getByText(/student/i)).toHaveCount(0);
  await expect(page.getByText(/professor/i)).toHaveCount(0);
  await expect(page.getByText(/role/i)).toHaveCount(0);
});
