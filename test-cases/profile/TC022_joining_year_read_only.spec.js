// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs } from './profile-helpers.js';

/** Web-only. Confirmed live: Joining Year (the second "Select date" field) stays disabled even in edit mode. */
test('TC022 - Verify Joining Year stays read-only in edit mode', async ({ page }) => {
  await loginAs(page);
  const profile = new ProfilePage(page);
  await profile.goto();
  await profile.editButton.click();
  await expect(profile.saveButton).toBeVisible();

  await expect(profile.dateInputs.nth(1)).toBeDisabled();
  await expect(profile.dateInputs.first()).toBeEnabled();
});
