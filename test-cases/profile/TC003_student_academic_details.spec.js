// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { ProfilePage } from './profile-page.js';

/**
 * Hive Test Cases Playwright.xlsx, sheet "Profile" (Android row TC004; web TC003) — Student's second profile badge.
 * Precondition: logged in as Student, on Profile screen.
 * Steps: 1. Open Profile. 2. Read the two pill badges under the name.
 * Expected (Android): second badge shows a course/branch string; Student's Profile also has a
 * PHONE field and an ACADEMIC DETAILS section.
 *
 * Reinterpreted for web, confirmed live: there are no pill badges. The same details appear as
 * form fields instead — the student account has Phone, Enrollment No., Department and Joining
 * Year all populated. Asserts non-empty rather than exact values so account data changes
 * don't break the test.
 */
test('TC003 - Verify a student profile shows phone and academic details', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_STUDENT_EMAIL'), credential('HIVE_STUDENT_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const profile = new ProfilePage(page);
  await profile.goto();

  await expect(profile.phone).not.toHaveValue('');
  await expect(profile.enrollment).not.toHaveValue('');
  await expect(profile.department).not.toHaveValue('');
  await expect(profile.dateInputs.nth(1)).not.toHaveValue('');
});
