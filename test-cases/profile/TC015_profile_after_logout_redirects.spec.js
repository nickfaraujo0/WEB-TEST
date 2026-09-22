// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { PROFILE_URL } from './profile-page.js';
import { loginAs, AccountMenu } from './profile-helpers.js';

/** Web-only. Confirmed live: after logging out, /profile is no longer reachable and redirects to /login. */
test('TC015 - Verify /profile redirects to login after logging out', async ({ page }) => {
  await loginAs(page);
  const menu = new AccountMenu(page);
  await menu.open();
  await menu.logoutItem.click();
  await menu.yesButton.click();
  await expect(page).toHaveURL(/\/login/i, { timeout: 20000 });

  await page.goto(PROFILE_URL, { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/login/i, { timeout: 20000 });
});
