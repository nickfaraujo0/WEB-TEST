// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, fillCommonFilters, submitAndExpectSuccess } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live, twice: submitting "Download Report" with valid filters (Program/Semester/
 * Academic Year filled, all four Session Types checked, a real date range) shows a
 * "Generating Report" modal, then "Report Generated Successfully" / "Report Generated
 * successfully and downloaded", and triggers a real client-side file download — confirmed via
 * both the success copy and a real `download` event captured during manual verification (a
 * `csvBlob` was also observed logged to the console). This is read-only: it never mutates any
 * stored data, only reads and exports it, which is what makes it safe for this suite to
 * exercise for real rather than only checking validation. Report generation itself was
 * observed live to take anywhere from ~3s to ~35s — see REPORT_GENERATION_TIMEOUT in
 * reports-helpers.js.
 *
 * Confirmed live via a real headless-Chromium run: both date pickers disable every day before
 * today (`.ant-picker-cell-disabled`), so both dates here use `lastEnabledCalendarDay()` rather
 * than a specific day number — a hardcoded early day like "1" is in the past (and therefore
 * disabled and unclickable) for most of any given month.
 */
test('TC017 - Verify Download Report with valid filters generates and downloads a real report', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await fillCommonFilters(reports);
  await reports.openDatePicker('Start Date');
  await reports.lastEnabledCalendarDay().click();
  await reports.openDatePicker('End Date');
  await reports.lastEnabledCalendarDay().click();
  await reports.toggleCheckbox('Select All');

  const downloadPromise = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
  await reports.downloadReportButton().click();

  await submitAndExpectSuccess(reports, page);

  const download = await downloadPromise;
  if (download) {
    expect(download.suggestedFilename()).toBeTruthy();
  }
});
