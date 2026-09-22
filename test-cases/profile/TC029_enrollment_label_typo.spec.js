// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { ProfilePage } from './profile-page.js';
import { loginAs } from './profile-helpers.js';

/**
 * Web-only. Real bug, confirmed live: the label above the Enrollment No. field reads
 * "Emrolment Number" (typo). The field's placeholder spells it correctly ("Enrollment No.").
 */
test('TC029 - Verify the Enrollment label is misspelled "Emrolment Number" (bug)', async ({ page }) => {
  await loginAs(page);
  const profile = new ProfilePage(page);
  await profile.goto();

  await expect(page.getByText('Emrolment Number')).toBeVisible();
  await expect(page.getByText('Enrollment Number')).toHaveCount(0);
});
