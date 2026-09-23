// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/** Confirmed live: each field's validation message clears independently as soon as that
 * specific field is filled — filling Program alone removes "Please select a Program!" while
 * every other still-empty field keeps showing its own message. */
test('TC016 - Verify filling in Program clears only the Program validation message', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await reports.downloadReportButton().click();
  await expect(page.getByText('Please select a Program!', { exact: true })).toBeVisible();

  await reports.selectField('Program', 'Computer Science');

  await expect(page.getByText('Please select a Program!', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Please select a Semester!', { exact: true })).toBeVisible();
});
