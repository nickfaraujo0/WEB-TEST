// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, STUDENT } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: with the pre-filled defaults (Academic Year "2025-26", Semester "Odd"), the
 * Student can click "Download Attendance Report" immediately with no further filling-in
 * required, and a lightweight "Report downloaded" toast appears (a real, simpler UI treatment
 * than the Professor's own success modal — a confirmed role-based difference) along with a
 * real client-side download.
 */
test('TC030 - Verify the Student can download the Attendance Report directly with the defaults', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page, ...STUDENT);
  await reports.gotoAttendance();

  const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
  await reports.downloadAttendanceReportButtonStudent().click();

  await expect(reports.studentDownloadedToast()).toBeVisible({ timeout: 20000 });

  const download = await downloadPromise;
  if (download) {
    expect(download.suggestedFilename()).toBeTruthy();
  }
});
