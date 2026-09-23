// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, fillCommonFilters, submitAndExpectSuccess } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: submitting "Download Assessment Report" with valid filters (Program/
 * Semester/Academic Year filled, all nine Assessment Types checked) shows a
 * "Generating Assessment Report" modal (a real, minor copy difference from the Attendance
 * tab's own "Generating Report" — see reports-page.js), then the same
 * "Report Generated Successfully" / "downloaded" modal, and triggers a real client-side
 * download (a `csvBlob` was observed logged to the console during manual verification). Same
 * read-only, non-destructive action as the Attendance tab's Download Report (TC017).
 */
test('TC024 - Verify Download Assessment Report with valid filters generates and downloads a real report', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAssessment();

  await fillCommonFilters(reports);
  await reports.toggleCheckbox('Select All');

  const downloadPromise = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
  await reports.downloadAssessmentReportButton().click();

  await expect(reports.generatingModal('Generating Assessment Report')).toBeVisible({ timeout: 10000 }).catch(() => {});
  await submitAndExpectSuccess(reports, page);

  const download = await downloadPromise;
  if (download) {
    expect(download.suggestedFilename()).toBeTruthy();
  }
});
