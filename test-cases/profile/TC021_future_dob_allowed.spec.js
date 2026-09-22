// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs } from './profile-helpers.js';

/**
 * Web-only. Real gap, confirmed live: the Date of Birth picker does not disable future
 * dates, so a date next year can be selected. Cancel is clicked at the end; nothing is saved.
 */
test('TC021 - Verify a future Date of Birth can be selected (bug)', async ({ page }) => {
  await loginAs(page);
  const profile = new ProfilePage(page);
  await profile.goto();
  await profile.editButton.click();
  const dob = profile.dateInputs.first();

  await dob.click();
  const picker = page.locator('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
  await expect(picker).toBeVisible();
  await expect(picker.locator('.ant-picker-cell-disabled')).toHaveCount(0);

  // The picker opens on the saved year, so page forward until it shows next year or later.
  const target = new Date().getFullYear() + 1;
  const yearButton = picker.locator('.ant-picker-year-btn');
  for (let i = 0; i < 10 && Number(await yearButton.innerText()) < target; i++) {
    await picker.locator('.ant-picker-header-super-next-btn').click();
  }
  await picker.locator('.ant-picker-cell-in-view').nth(9).click();

  const year = Number((await dob.inputValue()).slice(0, 4));
  expect(year).toBeGreaterThanOrEqual(target);
  await profile.cancelButton.click();
});
