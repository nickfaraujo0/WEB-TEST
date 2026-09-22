// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs } from './profile-helpers.js';

/**
 * Web-only. Sends a REAL password-reset email to the logged-in account, so it is opt-in:
 * it is skipped unless HIVE_ALLOW_RESET_EMAIL=1 is set. Not yet run — what the page shows
 * after "Send Reset Link" has not been observed, so the assertion below (the dialog closes)
 * is an assumption to confirm on the first opted-in run and tighten from there.
 */
test('TC031 - Verify Send Reset Link closes the dialog after sending', async ({ page }) => {
  test.skip(!process.env.HIVE_ALLOW_RESET_EMAIL, 'Sends a real reset email; set HIVE_ALLOW_RESET_EMAIL=1 to run.');

  await loginAs(page);
  const profile = new ProfilePage(page);
  await profile.goto();
  await profile.changePasswordButton.click();

  await profile.resetDialog.getByRole('button', { name: 'Send Reset Link' }).click();

  await expect(profile.resetDialog).not.toBeVisible({ timeout: 20000 });
});
