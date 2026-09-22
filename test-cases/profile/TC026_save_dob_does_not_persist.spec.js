// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs, PROFESSOR2 } from './profile-helpers.js';

/**
 * Web-only. Real bug, confirmed live (same root cause as TC024 — the `EditUser` request is
 * blocked): a Date of Birth typed into the picker and saved is gone after a reload. Runs as
 * the second professor and restores the original value in `finally` in case saving ever
 * starts working.
 */
test('TC026 - Verify Save Changes does not persist a new Date of Birth (bug)', async ({ page }) => {
  await loginAs(page, ...PROFESSOR2);
  const profile = new ProfilePage(page);
  await profile.goto();
  const original = await profile.dateInputs.first().inputValue();
  const newValue = original === '1999-05-17' ? '1999-05-18' : '1999-05-17';

  try {
    await profile.editButton.click();
    const dob = profile.dateInputs.first();
    await dob.click();
    await dob.fill(newValue);
    await page.keyboard.press('Enter');
    await expect(dob).toHaveValue(newValue);
    await profile.saveButton.click();
    await page.waitForTimeout(3000);

    await profile.goto();
    await expect(profile.dateInputs.first()).toHaveValue(original);
  } finally {
    await profile.goto();
    if ((await profile.dateInputs.first().inputValue()) !== original) {
      await profile.editButton.click();
      const dob = profile.dateInputs.first();
      await dob.click();
      await dob.fill(original);
      await page.keyboard.press('Enter');
      await profile.saveButton.click();
    }
  }
});
