// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, AccountMenu } from './profile-helpers.js';

/**
 * Web-only. Real gap, confirmed live: /profile works when typed into the address bar, but
 * nothing in the UI links to it. The sidebar has only Buzz, Courses, Messages, Opportunity
 * and Reports, no anchor on Buzz points at a profile URL, and the top-right account menu
 * (which the Android app uses to open Profile) lists only the name, email and Logout —
 * clicking the name, email or avatar inside it does nothing.
 */
test('TC008 - Verify no link to the Profile page exists in the UI (bug)', async ({ page }) => {
  await loginAs(page);

  await expect(page.locator('a[href*="profile" i]')).toHaveCount(0);

  const menu = new AccountMenu(page);
  await menu.open();
  await expect(menu.logoutItem).toBeVisible();
  await expect(page.getByText('Profile', { exact: true })).toHaveCount(0);
});
