// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live via className: Grading Criteria defaults to "Graded" selected (not "All",
 * despite "All" being listed first) and the three pills (All / Graded / Ungraded) are
 * mutually exclusive — clicking "All" deselects "Graded" and vice versa.
 */
test('TC021 - Verify Grading Criteria defaults to "Graded" and pills are mutually exclusive', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAssessment();

  expect(await reports.isGradingCriteriaSelected('Graded')).toBe(true);
  expect(await reports.isGradingCriteriaSelected('All')).toBe(false);
  expect(await reports.isGradingCriteriaSelected('Ungraded')).toBe(false);

  await reports.gradingCriteriaButton('All').click();

  expect(await reports.isGradingCriteriaSelected('All')).toBe(true);
  expect(await reports.isGradingCriteriaSelected('Graded')).toBe(false);
});
