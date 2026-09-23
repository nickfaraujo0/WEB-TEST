// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, STUDENT } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: the Student's own Attendance Report is a deliberately much smaller form than
 * the Professor's — only "Academic Year" and "Semester" fields plus a single
 * "Download Attendance Report" button. There is no Program, Division, Start/End Date, Session
 * Types, or Attendance Threshold control at all on this account — a real, confirmed role
 * difference, not a partially-loaded page.
 */
test('TC027 - Verify the Student\'s Attendance Report form is a simplified subset of the Professor\'s', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page, ...STUDENT);
  await reports.gotoAttendance();

  await expect(page.getByText('Academic Year', { exact: true })).toBeVisible();
  await expect(page.getByText('Semester', { exact: true })).toBeVisible();
  await expect(reports.downloadAttendanceReportButtonStudent()).toBeVisible();

  await expect(page.getByText('Program', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Division', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Attendance Threshold', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Session Types', { exact: true })).toHaveCount(0);
});
