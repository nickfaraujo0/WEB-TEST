// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/** Confirmed live: the Academic Year dropdown offers exactly "Custom", "2027-28", "2025-26",
 * and "2024-25" (in that order) for the professor account. */
test('TC005 - Verify the Academic Year dropdown lists Custom and three real academic years', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await reports.openSelect('Academic Year');
  for (const year of ['Custom', '2027-28', '2025-26', '2024-25']) {
    await expect(page.locator('.ant-select-item-option', { hasText: year }).first()).toBeVisible();
  }
});
