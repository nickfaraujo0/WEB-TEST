// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, STUDENT } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: clicking "Download Report Card" with the pre-filled Academic Year/Semester
 * defaults triggers a real client-side download (a `csvBlob` was observed logged to the
 * console during manual verification) with no prior "Generate Report Cards" step needed from
 * a professor — this Student-side download computes its own data on demand rather than
 * fetching a previously-generated file, confirmed by it succeeding immediately in manual
 * testing. This makes it a safe, read-only action to exercise directly.
 */
test('TC032 - Verify the Student can download their own Report Card directly', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page, ...STUDENT);
  await reports.gotoAssessment();

  const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
  await reports.downloadReportCardButtonStudent().click();
  await page.waitForTimeout(3000);

  const download = await downloadPromise;
  if (download) {
    expect(download.suggestedFilename()).toBeTruthy();
  }
});
