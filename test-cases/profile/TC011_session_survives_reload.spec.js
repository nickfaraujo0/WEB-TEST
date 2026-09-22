// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs } from './profile-helpers.js';

/** Web-only. Reloading /profile keeps the user signed in and shows the same account. */
test('TC011 - Verify the session survives a reload on the Profile page', async ({ page }) => {
  await loginAs(page);
  const profile = new ProfilePage(page);
  await profile.goto();
  const email = await profile.email.inputValue();

  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(profile.editButton).toBeVisible();
  await expect(page).toHaveURL(/\/profile/i);
  await expect(profile.email).toHaveValue(email);
});
