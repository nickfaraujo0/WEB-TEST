// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: hovering the Division field before both Program and Semester are chosen
 * shows a real antd Tooltip reading "Select Program & Semester first" (confirmed via a live
 * screenshot during manual exploration). Division itself has no required-field validation
 * (confirmed live: submitting the form with Division untouched shows no
 * "Please select a Division!" message, unlike Program/Semester/Academic Year) — it's an
 * optional filter gated behind a helpful hint, not a hard requirement.
 */
test('TC006 - Verify Division shows a "Select Program & Semester first" tooltip before both are chosen', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await reports.selectTrigger('Division').hover();
  await expect(page.getByText('Select Program & Semester first', { exact: true })).toBeVisible({ timeout: 10000 });
});
