// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live: the Course field is present on the Assessment tab, but for the
 * Computer Science / Semester 1 / 2025-26 combination used throughout this suite it has no
 * real options to offer (confirmed live: opening it shows no dropdown panel at all). Confirmed
 * live via an empty-form submit that Course carries no required-field validation message
 * either, unlike Program/Semester/Academic Year — it's a genuinely optional filter. This test
 * only checks validation state (safe, no network call) — TC024 covers the full valid-submit
 * download flow for this tab.
 */
test('TC020 - Verify the Course field is present and optional on the Assessment tab', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAssessment();

  await expect(reports.selectTrigger('Course')).toBeVisible();

  await reports.downloadAssessmentReportButton().click();

  await expect(page.getByText('Please select a Course', { exact: false })).toHaveCount(0);
});
