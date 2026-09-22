// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { ProfilePage } from './profile-page.js';

/**
 * Hive Test Cases Playwright.xlsx, sheet "Profile", TC001 — Header edit-pencil opens Edit Profile.
 * Precondition: logged in, on Profile screen.
 * Steps: 1. Open Profile. 2. Tap the top-right edit-pencil icon.
 * Expected (Android): opens an Edit Profile screen with editable fields.
 *
 * Reinterpreted for web, confirmed live: there is no pencil icon or separate screen — the
 * "Edit" button on /profile unlocks the form in place, swapping the buttons to Cancel and
 * Save Changes. Only Display Name and Date of Birth become editable; every other field stays
 * read-only. Nothing is saved (Save Changes is never clicked).
 */
test('TC001 - Verify the Edit button unlocks the profile form in place', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const profile = new ProfilePage(page);
  await profile.goto();

  await profile.editButton.click();

  await expect(profile.saveButton).toBeVisible();
  await expect(profile.cancelButton).toBeVisible();
  expect(await profile.enabledPlaceholders()).toEqual(['Display Name', 'Select date']);

  // Cancel returns to the read-only state without saving anything.
  await profile.cancelButton.click();
  await expect(profile.editButton).toBeVisible();
  expect(await profile.enabledPlaceholders()).toEqual([]);
});
