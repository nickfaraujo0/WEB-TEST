// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs } from './profile-helpers.js';

/**
 * Web-only. Real gap, confirmed live: Display Name accepts a 120-character value with no
 * limit and no message. Nothing is saved.
 */
test('TC018 - Verify Display Name has no maximum length (bug)', async ({ page }) => {
  await loginAs(page);
  const profile = new ProfilePage(page);
  await profile.goto();
  await profile.editButton.click();

  await profile.displayName.fill('x'.repeat(120));

  await expect(profile.displayName).toHaveValue('x'.repeat(120));
  await expect(page.locator('.ant-form-item-explain-error')).toHaveCount(0);
});
