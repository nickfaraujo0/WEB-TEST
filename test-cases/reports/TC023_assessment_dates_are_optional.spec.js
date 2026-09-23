// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live, a real contrast with the Attendance tab (TC015): submitting the Assessment
 * tab's forms with an empty form shows Program/Semester/Academic Year/Assessment Types
 * messages, but Start Date and End Date show NO validation message at all here — they are
 * optional on this tab even though the visually-identical fields are required on Attendance.
 */
test('TC023 - Verify Start Date / End Date carry no validation message on the Assessment tab', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAssessment();

  await reports.downloadAssessmentReportButton().click();

  await expect(page.getByText('Please select a Program!', { exact: true })).toBeVisible();
  await expect(page.getByText('Please select a Semester!', { exact: true })).toBeVisible();
  await expect(page.getByText('Please select a Academic Year!', { exact: true })).toBeVisible();
  await expect(page.getByText('Please select at least one the Assessment Types!', { exact: true })).toBeVisible();

  await expect(page.getByText('Please select an Start Date!', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Please select an End Date!', { exact: true })).toHaveCount(0);
});
