// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, STUDENT } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/** Confirmed live: despite the much simpler forms, the Student account still has full access
 * to the Reports sidebar entry and both the Attendance and Assessment sub-tabs — the
 * simplification is limited to the forms' own fields, not the navigation. */
test('TC034 - Verify the Student can reach both the Attendance and Assessment sub-tabs', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page, ...STUDENT);

  await page.getByRole('link', { name: 'Reports' }).click();
  await expect(page).toHaveURL(/\/Reports\/Attendance/i, { timeout: 20000 });
  await expect(reports.attendanceTab).toHaveAttribute('aria-selected', 'true');

  await reports.assessmentTab.click();
  await expect(page).toHaveURL(/\/Reports\/Assessments/i, { timeout: 20000 });
  await expect(reports.assessmentTab).toHaveAttribute('aria-selected', 'true');
});
