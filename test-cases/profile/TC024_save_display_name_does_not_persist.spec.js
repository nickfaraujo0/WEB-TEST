// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs, PROFESSOR2 } from './profile-helpers.js';

/**
 * Web-only. Real bug, confirmed live: Save Changes never saves. Clicking it calls the
 * `EditUser` cloud function, the browser blocks that request (CORS error from
 * hive-dev.thegritcity.com), and the page then throws a React error instead of showing
 * anything — no success or error message, the form stays in edit mode, and after a reload
 * the old value is back.
 *
 * Runs as the second professor so the main account is never touched, and restores the
 * original Display Name in `finally` in case saving ever starts working (which would make
 * the assertions below fail and flag that this test needs updating).
 */
test('TC024 - Verify Save Changes does not persist a new Display Name (bug)', async ({ page }) => {
  await loginAs(page, ...PROFESSOR2);
  const profile = new ProfilePage(page);
  await profile.goto();
  const original = await profile.displayName.inputValue();

  try {
    await profile.editButton.click();
    await profile.displayName.fill(`${original} QA`);
    const blocked = page.waitForEvent('requestfailed', (r) => r.url().includes('EditUser'), { timeout: 20000 });
    await profile.saveButton.click();
    await blocked;

    await expect(page.locator('.ant-message, .ant-notification, [role="alert"]')).toHaveCount(0);
    await expect(profile.saveButton).toBeVisible();

    await profile.goto();
    await expect(profile.displayName).toHaveValue(original);
  } finally {
    await profile.goto();
    if ((await profile.displayName.inputValue()) !== original) {
      await profile.editButton.click();
      await profile.displayName.fill(original);
      await profile.saveButton.click();
    }
  }
});
