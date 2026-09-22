// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs, STUDENT } from './profile-helpers.js';

/**
 * Web-only. Confirmed live: the two roles share one form but the data differs — the first
 * professor account has no Phone or Enrollment No., while the student account has both.
 */
test.describe('TC027 - Phone and Enrollment No. by role', () => {
  test('TC027-Professor', async ({ page }) => {
    await loginAs(page);
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.phone).toHaveValue('');
    await expect(profile.enrollment).toHaveValue('');
  });

  test('TC027-Student', async ({ page }) => {
    await loginAs(page, ...STUDENT);
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.phone).not.toHaveValue('');
    await expect(profile.enrollment).not.toHaveValue('');
  });
});
