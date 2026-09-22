// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { credential } from '../login/credentials.js';
import { ProfilePage } from './profile-page.js';
import { loginAs, PROFESSOR2 } from './profile-helpers.js';

/**
 * Web-only. Confirmed live: the second professor (peters@gmail.com) sees their own details,
 * not the first professor's — a check that profile data is per-account, not shared.
 */
test('TC010 - Verify the second professor sees their own profile', async ({ page }) => {
  await loginAs(page, ...PROFESSOR2);
  const profile = new ProfilePage(page);
  await profile.goto();

  await expect(profile.email).toHaveValue(credential('HIVE_PROFESSOR2_EMAIL'));
  await expect(profile.email).not.toHaveValue(credential('HIVE_VALID_EMAIL'));
});
