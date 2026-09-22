// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs } from './profile-helpers.js';

/**
 * Web-only. Real gap, confirmed live: clearing Display Name shows no validation message and
 * Save Changes stays enabled. Save is never clicked, so nothing is submitted.
 */
test('TC017 - Verify an empty Display Name shows no error and Save stays enabled (bug)', async ({ page }) => {
  await loginAs(page);
  const profile = new ProfilePage(page);
  await profile.goto();
  await profile.editButton.click();

  await profile.displayName.fill('');

  await expect(page.locator('.ant-form-item-explain-error')).toHaveCount(0);
  await expect(profile.saveButton).toBeEnabled();
});
