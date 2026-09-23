// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * "Generate Report Cards" is a bulk, dark/prominently-styled action confirmed live to be
 * distinct from "Download Assessment Report" — its name and styling both suggest it compiles
 * and/or officially issues real per-student report cards, a materially more consequential
 * action than a read-only export. Per this suite's standing non-destructive-data rule, this
 * test deliberately stops at client-side validation (which never reaches the network) and does
 * NOT submit the button with a valid, real filter combination — see summary.md for the full
 * reasoning and the documented gap this leaves.
 */
test('TC025 - Verify Generate Report Cards shows the same required-field validation on an empty form', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAssessment();

  await reports.generateReportCardsButton().click();

  await expect(page.getByText('Please select a Program!', { exact: true })).toBeVisible();
  await expect(page.getByText('Please select a Semester!', { exact: true })).toBeVisible();
  await expect(page.getByText('Please select a Academic Year!', { exact: true })).toBeVisible();
  await expect(page.getByText('Please select at least one the Assessment Types!', { exact: true })).toBeVisible();
});
