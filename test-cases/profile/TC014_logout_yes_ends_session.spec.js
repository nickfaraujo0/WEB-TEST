// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, AccountMenu } from './profile-helpers.js';

/** Web-only. Confirmed live: choosing Yes on the logout prompt ends the session and lands on /login. */
test('TC014 - Verify choosing Yes on the logout prompt logs the user out', async ({ page }) => {
  await loginAs(page);
  const menu = new AccountMenu(page);
  await menu.open();

  await menu.logoutItem.click();
  await menu.yesButton.click();

  await expect(page).toHaveURL(/\/login/i, { timeout: 20000 });
});
