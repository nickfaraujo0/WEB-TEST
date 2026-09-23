// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: the sidebar "Reports" link's own href is just "/Reports" (no sub-path), and
 * clicking it lands on "/Reports/Attendance" with the Attendance tab active by default
 * (`aria-selected="true"`, confirmed via a real accessibility-tree/outerHTML check).
 *
 * Confirmed live via a real headless-Chromium run's own innerHTML dump (and cross-checked with
 * a MutationObserver across the whole navigation, once the app was already warm): the top
 * "Attendance Report" page heading is a plain `<div>`, not a semantic heading —
 * `getByRole('heading', ...)` matches nothing there. See `ReportsPage.pageHeading()`'s own
 * comment for the full story.
 *
 * Confirmed live, separately: landing on Reports immediately after a FRESH login (as this test
 * does) can briefly render a real `<h2>Attendance Report</h2>` as part of a transient loading
 * skeleton — alongside the persistent outer div of the same exact text — which is a genuine
 * strict-mode double-match for a moment (a real run's error-context snapshot caught it: a
 * disabled "Download Attendance Report" button and an un-prefilled Academic Year, i.e. a
 * not-yet-hydrated state). This resolves itself once the real Professor form mounts, so this
 * test waits for that via `waitForFormReady()` before asserting on the heading at all.
 */
test('TC001 - Verify the Reports nav link lands on the Attendance tab by default', async ({ page }) => {
  await loginAs(page);
  await page.getByRole('link', { name: 'Reports' }).click();
  await expect(page).toHaveURL(/\/Reports\/Attendance/i, { timeout: 20000 });

  const reports = new ReportsPage(page);
  await reports.waitForFormReady();
  await expect(reports.attendanceTab).toHaveAttribute('aria-selected', 'true');
  await expect(reports.assessmentTab).toHaveAttribute('aria-selected', 'false');
  await expect(reports.pageHeading('Attendance Report')).toBeVisible();
});
