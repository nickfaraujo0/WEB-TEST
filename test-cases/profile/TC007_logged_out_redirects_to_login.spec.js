// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { PROFILE_URL } from './profile-page.js';

/**
 * Web-only (not in the Android sheet). Confirmed live: opening /profile without a session
 * redirects to /login instead of showing the page.
 */
test('TC007 - Verify a logged-out visit to /profile redirects to login', async ({ page }) => {
  await page.goto(PROFILE_URL, { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/login/i, { timeout: 20000 });
});
