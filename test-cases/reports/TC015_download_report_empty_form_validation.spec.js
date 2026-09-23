// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: submitting "Download Report" with every field empty shows one validation
 * message per required field, reproduced here VERBATIM including three confirmed real copy
 * bugs: "Please select a Academic Year!" (missing "n"), "Please select an Start Date!" /
 * "an End Date!" (wrong article — should be "a"), and
 * "Please select at least one the Session Types!" (missing "of"). Division has no message at
 * all (confirmed optional). This is purely client-side antd form validation — clicking
 * Download Report on an empty form never reaches the network, so it's inherently safe.
 */
test('TC015 - Verify Download Report on an empty form shows every required-field message', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAttendance();

  await reports.downloadReportButton().click();

  await expect(page.getByText('Please select a Program!', { exact: true })).toBeVisible();
  await expect(page.getByText('Please select a Semester!', { exact: true })).toBeVisible();
  await expect(page.getByText('Please select a Academic Year!', { exact: true })).toBeVisible();
  await expect(page.getByText('Please select an Start Date!', { exact: true })).toBeVisible();
  await expect(page.getByText('Please select an End Date!', { exact: true })).toBeVisible();
  await expect(page.getByText('Please select at least one the Session Types!', { exact: true })).toBeVisible();
});
