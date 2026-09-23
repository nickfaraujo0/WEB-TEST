// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, STUDENT } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/** Confirmed live: the Student's Assessment sub-tab form is titled "Assessment Report Card"
 * (the page's own top heading still reads "Assessment Report", shared with the Professor's
 * view) — a real, distinct copy choice from the Professor's "Student Assessment Report". */
test('TC031 - Verify the Student\'s Assessment form is titled "Assessment Report Card"', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page, ...STUDENT);
  await reports.gotoAssessment();

  await expect(reports.pageHeading('Assessment Report')).toBeVisible();
  await expect(page.getByText('Assessment Report Card', { exact: true })).toBeVisible();
  await expect(page.getByText('Student Assessment Report', { exact: true })).toHaveCount(0);
});
