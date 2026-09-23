// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: clicking the "Assessment" tab navigates to "/Reports/Assessments" (plural —
 * see reports-page.js's own comment on this route-vs-label naming mismatch) and the page
 * heading updates to "Assessment Report" while the form's own title reads
 * "Student Assessment Report".
 */
test('TC002 - Verify switching to the Assessment tab updates the URL and heading', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await reports.assessmentTab.click();
  await expect(page).toHaveURL(/\/Reports\/Assessments/i, { timeout: 20000 });
  await expect(reports.assessmentTab).toHaveAttribute('aria-selected', 'true');
  await expect(reports.pageHeading('Assessment Report')).toBeVisible();
  await expect(page.getByText('Student Assessment Report', { exact: true })).toBeVisible();
});
