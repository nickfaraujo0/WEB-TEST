// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs } from './profile-helpers.js';

/**
 * Web-only. The Reset Password dialog can be dismissed without sending anything — Escape
 * and a click outside the dialog, both confirmed live. Each only works once the dialog's
 * open animation has finished: pressing Escape while it is still zooming in does nothing,
 * so the tests wait for the animation classes to clear first.
 */
test.describe('TC030 - Reset Password dialog closes without sending', () => {
  test('TC030-Escape', async ({ page }) => {
    await loginAs(page);
    const profile = new ProfilePage(page);
    await profile.goto();
    await profile.changePasswordButton.click();
    await expect(profile.resetDialog).toBeVisible();

    await expect(profile.resetDialog).not.toHaveClass(/ant-zoom-appear/);
    await page.keyboard.press('Escape');

    await expect(profile.resetDialog).not.toBeVisible();
  });

  test('TC030-Outside-click', async ({ page }) => {
    await loginAs(page);
    const profile = new ProfilePage(page);
    await profile.goto();
    await profile.changePasswordButton.click();
    await expect(profile.resetDialog).toBeVisible();

    await expect(profile.resetDialog).not.toHaveClass(/ant-zoom-appear/);
    await page.mouse.click(5, 5);

    await expect(profile.resetDialog).not.toBeVisible();
  });
});
