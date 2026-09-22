// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs, PROFESSOR2 } from './profile-helpers.js';

/**
 * Web-only. Real bug, confirmed live (same root cause as TC024): clicking Save Changes
 * without editing anything gives no confirmation and leaves the form in edit mode instead of
 * returning to read-only. Runs as the second professor; the values submitted are unchanged.
 */
test('TC025 - Verify Save Changes with no edits gives no feedback and stays in edit mode (bug)', async ({ page }) => {
  await loginAs(page, ...PROFESSOR2);
  const profile = new ProfilePage(page);
  await profile.goto();
  await profile.editButton.click();

  await profile.saveButton.click();
  await page.waitForTimeout(3000);

  await expect(page.locator('.ant-message, .ant-notification, [role="alert"]')).toHaveCount(0);
  await expect(profile.saveButton).toBeVisible();
  await expect(profile.editButton).toHaveCount(0);
});
