// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { ProfilePage } from './profile-page.js';

/**
 * Hive Test Cases Playwright.xlsx, sheet "Profile" (Android row TC007; web TC005) — Faculty Edit Profile form shape.
 * Precondition: logged in as Faculty, on Profile screen.
 * Steps: 1. Open Profile. 2. Tap Edit profile. 3. Inspect the fields. 4. Back out without editing.
 * Expected (Android): exactly 5 fields, each pre-filled and disabled.
 *
 * Confirmed live on web: the form has 11 fields (First Name, Last Name, Display Name, Title,
 * Email, Phone, Date of Birth, Enrollment No., College Name, Department, Joining Year), all
 * disabled by default. Checked before clicking Edit, so nothing is modified. Name and email
 * are pre-filled for the faculty account.
 */
test('TC005 - Verify the faculty profile form shape', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const profile = new ProfilePage(page);
  await profile.goto();

  await expect(profile.inputs).toHaveCount(11);
  expect(await profile.enabledPlaceholders()).toEqual([]);
  for (const field of [profile.firstName, profile.lastName, profile.email, profile.college, profile.department]) {
    await expect(field).toBeDisabled();
  }
  await expect(profile.firstName).not.toHaveValue('');
  await expect(profile.email).toHaveValue(credential('HIVE_VALID_EMAIL'));
});
