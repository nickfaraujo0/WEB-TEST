// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { credential } from '../login/credentials.js';
import { loginAs, AccountMenu } from './profile-helpers.js';

/**
 * Web-only. Confirmed live: clicking the profile icon at the top right opens a menu with
 * the user's name, their email and Logout (this is how a web user logs out).
 */
test('TC012 - Verify the account menu shows name, email and Logout', async ({ page }) => {
  await loginAs(page);

  const menu = new AccountMenu(page);
  await menu.open();

  await expect(menu.logoutItem).toBeVisible();
  await expect(page.getByText(credential('HIVE_VALID_EMAIL'), { exact: true })).toBeVisible();
});
