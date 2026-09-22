// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { ProfilePage } from './profile-page.js';

/**
 * Hive Test Cases Playwright.xlsx, sheet "Profile" (Android row TC008; web TC006) — Student Edit Profile form shape.
 * Precondition: logged in as Student, on Profile screen.
 * Steps: 1. Open Profile. 2. Tap Edit profile. 3. Inspect all fields. 4. Back out without editing.
 * Expected (Android): 7 fields (adds Roll No, Program, Year of Joining), all disabled.
 *
 * Confirmed live on web: the student sees the same 11-field form as faculty (no role-specific
 * layout), all disabled by default, with the student's own email and populated Enrollment No.
 * Checked before clicking Edit, so nothing is modified.
 */
test('TC006 - Verify the student profile form shape', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_STUDENT_EMAIL'), credential('HIVE_STUDENT_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const profile = new ProfilePage(page);
  await profile.goto();

  await expect(profile.inputs).toHaveCount(11);
  expect(await profile.enabledPlaceholders()).toEqual([]);
  await expect(profile.email).toHaveValue(credential('HIVE_STUDENT_EMAIL'));
  await expect(profile.enrollment).not.toHaveValue('');
});
