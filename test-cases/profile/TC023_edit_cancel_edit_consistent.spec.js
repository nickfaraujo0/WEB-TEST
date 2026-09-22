// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs } from './profile-helpers.js';

/** Web-only. Toggling Edit -> Cancel twice gives the same result each time: only Display Name and Date of Birth unlock. */
test('TC023 - Verify Edit, Cancel, Edit again behaves consistently', async ({ page }) => {
  await loginAs(page);
  const profile = new ProfilePage(page);
  await profile.goto();

  for (let round = 0; round < 2; round++) {
    await profile.editButton.click();
    await expect(profile.saveButton).toBeVisible();
    expect(await profile.enabledPlaceholders()).toEqual(['Display Name', 'Select date']);

    await profile.cancelButton.click();
    await expect(profile.editButton).toBeVisible();
    expect(await profile.enabledPlaceholders()).toEqual([]);
  }
});
