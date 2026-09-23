// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/** Confirmed live: navigating straight to the Assessment tab shows page heading
 * "Assessment Report" and form title "Student Assessment Report" (the Professor's own
 * wording — contrast with the Student's "Assessment Report Card", see TC031). */
test('TC019 - Verify the Assessment tab heading and form title for the Professor', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAssessment();

  await expect(reports.pageHeading('Assessment Report')).toBeVisible();
  await expect(page.getByText('Student Assessment Report', { exact: true })).toBeVisible();
});
