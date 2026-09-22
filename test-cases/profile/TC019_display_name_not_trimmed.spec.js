// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs } from './profile-helpers.js';

/**
 * Web-only. Real gap, confirmed live: leading and trailing spaces typed into Display Name are
 * kept as-is (no trimming). Nothing is saved.
 */
test('TC019 - Verify Display Name keeps leading and trailing spaces (bug)', async ({ page }) => {
  await loginAs(page);
  const profile = new ProfilePage(page);
  await profile.goto();
  await profile.editButton.click();

  await profile.displayName.fill('  spaced  ');

  await expect(profile.displayName).toHaveValue('  spaced  ');
});
