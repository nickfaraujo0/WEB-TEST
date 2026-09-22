// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs } from './profile-helpers.js';

/**
 * Web-only. In edit mode the Date of Birth field opens a calendar picker and picking a day
 * fills the field. Cancel is clicked at the end, so nothing is saved.
 */
test('TC020 - Verify the Date of Birth picker opens and selects a date', async ({ page }) => {
  await loginAs(page);
  const profile = new ProfilePage(page);
  await profile.goto();
  await profile.editButton.click();
  const dob = profile.dateInputs.first();
  const before = await dob.inputValue();

  await dob.click();
  const picker = page.locator('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
  await expect(picker).toBeVisible();

  await picker.locator('.ant-picker-cell-in-view').nth(9).click();

  await expect(dob).not.toHaveValue(before);
  await profile.cancelButton.click();
});
