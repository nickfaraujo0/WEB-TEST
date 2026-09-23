// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, STUDENT } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/** Confirmed live: none of the Professor-only Assessment-tab controls (Program, Course,
 * Grading Criteria, Assessment Types, "Generate Report Cards") render for the Student — same
 * confirmed role-based simplification as the Attendance tab (TC027). */
test('TC033 - Verify the Student\'s Assessment tab lacks every Professor-only control', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page, ...STUDENT);
  await reports.gotoAssessment();

  await expect(page.getByText('Program', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Course', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Grading Criteria', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Assessment Types', { exact: true })).toHaveCount(0);
  await expect(reports.generateReportCardsButton()).toHaveCount(0);
});
