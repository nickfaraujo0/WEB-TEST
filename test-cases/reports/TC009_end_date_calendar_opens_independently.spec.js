// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: End Date is its own independent antd DatePicker — it opens its own calendar
 * panel without requiring Start Date to be filled first, and picking a day fills the field
 * with the real "DD Month YYYY" formatted value.
 *
 * Confirmed live via a real headless-Chromium run: every day before today carries
 * `.ant-picker-cell-disabled` and cannot be clicked (see `ReportsPage.calendarDay()`'s own
 * comment) — this test picks the last enabled day of the visible month rather than a
 * hardcoded number, so it stays valid no matter what day of the month a run executes on.
 */
test('TC009 - Verify the End Date calendar opens and fills the field independently of Start Date', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await reports.openDatePicker('End Date');
  await expect(page.locator('.ant-picker-panel')).toBeVisible({ timeout: 10000 });
  await reports.lastEnabledCalendarDay().click();
  await expect(reports.dateInput('End Date')).not.toHaveValue('');
});
