// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: the Attendance Threshold is pure local form state, never persisted anywhere
 * — changing it to 80% and then reloading the page brings it straight back to the 100%
 * default. This is what makes it safe for this whole suite to interact with freely: there is
 * nothing server-side to roll back (see summary.md for the full live verification of this).
 */
test('TC014 - Verify the Attendance Threshold resets to 100% after a page reload (not persisted)', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await reports.thresholdDecreaseButton().click();
  await expect(reports.thresholdInput()).not.toHaveValue('100%');

  await reports.gotoAttendance();
  await expect(reports.thresholdInput()).toHaveValue('100%');
});
