// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: the Program dropdown is a real antd Select populated from actual program
 * data, including duplicate entries ("Chemical Engineering" appears 3 times) and clearly
 * test/placeholder programs ("df", "Hel", "Just A Program") — real dummy data on this dev
 * environment, not a locator bug. This test only asserts on the stable, always-present
 * "Computer Science" option (used throughout this suite) and the confirmed duplicate, rather
 * than the full list, since the full list is dev-environment dummy data that could change.
 */
test('TC003 - Verify the Program dropdown lists real programs, including confirmed duplicates', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await reports.openSelect('Program');
  await expect(page.locator('.ant-select-item-option', { hasText: 'Computer Science' }).first()).toBeVisible();
  await expect(page.locator('.ant-select-item-option', { hasText: 'Chemical Engineering' })).toHaveCount(3);
});
