// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, AccountMenu } from './profile-helpers.js';

/**
 * Web-only. Confirmed live: Logout opens an "Are you sure you want to Logout" dialog with
 * No and Yes; choosing No closes it and keeps the user signed in on the same page.
 */
test('TC013 - Verify choosing No on the logout prompt keeps the user signed in', async ({ page }) => {
  await loginAs(page);
  const menu = new AccountMenu(page);
  await menu.open();

  await menu.logoutItem.click();
  await expect(menu.confirmDialog).toContainText('Are you sure you want to Logout');

  await menu.noButton.click();

  await expect(menu.confirmDialog).not.toBeVisible();
  await expect(page).toHaveURL(/\/Buzz/i);
});
