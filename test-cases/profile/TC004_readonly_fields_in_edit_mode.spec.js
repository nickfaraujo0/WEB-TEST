// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { ProfilePage } from './profile-page.js';

/**
 * Hive Test Cases Playwright.xlsx, sheet "Profile" (Android row TC005; web TC004) — College/Phone/Email fields are read-only.
 * Precondition: logged in, on Profile screen.
 * Steps: 1. Tap College field. 2. Tap Phone field. 3. Tap Email field.
 * Expected: COLLEGE and EMAIL are read-only (Android also found Faculty has no Phone field).
 *
 * Confirmed live on web: even after clicking Edit, College Name, Email and Phone stay disabled
 * (as do First/Last Name, Title, Enrollment No., Department) — only Display Name and Date of
 * Birth unlock. Unlike Android, the faculty account does have a Phone field on web (empty).
 */
test('TC004 - Verify College, Phone and Email stay read-only in edit mode', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const profile = new ProfilePage(page);
  await profile.goto();
  await profile.editButton.click();
  await expect(profile.saveButton).toBeVisible();

  await expect(profile.college).toBeDisabled();
  await expect(profile.phone).toBeDisabled();
  await expect(profile.email).toBeDisabled();
});
