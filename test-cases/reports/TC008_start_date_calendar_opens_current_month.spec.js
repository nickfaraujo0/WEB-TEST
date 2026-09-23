// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/** Confirmed live: clicking the Start Date field opens a real antd calendar panel on the
 * current month, with today's cell carrying `.ant-picker-cell-today`. */
test('TC008 - Verify the Start Date calendar opens on the current month with today highlighted', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await reports.openDatePicker('Start Date');
  await expect(page.locator('.ant-picker-panel')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.ant-picker-cell-today')).toBeVisible();
});
