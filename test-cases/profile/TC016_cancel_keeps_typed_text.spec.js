// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs } from './profile-helpers.js';

/**
 * Web-only. Real bug, confirmed live: clicking Cancel after typing in Display Name puts the
 * form back to read-only (Edit button returns) but leaves the typed text in the field
 * instead of restoring the saved value. Nothing is ever saved, so a reload shows the real
 * value again — it is stale UI state, not data loss.
 */
test('TC016 - Verify Cancel leaves the typed text in Display Name (bug)', async ({ page }) => {
  await loginAs(page);
  const profile = new ProfilePage(page);
  await profile.goto();
  const original = await profile.displayName.inputValue();

  await profile.editButton.click();
  await profile.displayName.fill('CHANGED');
  await profile.cancelButton.click();

  await expect(profile.editButton).toBeVisible();
  await expect(profile.displayName).toHaveValue('CHANGED');
  await expect(profile.displayName).not.toHaveValue(original);
});
