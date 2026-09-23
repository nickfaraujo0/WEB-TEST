// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs } from './reports-helpers.js';
import { ReportsPage } from './reports-page.js';

/**
 * Confirmed live via className: "Generate Report Cards" is enabled and visually distinct
 * (dark background) from the lighter-green "Download Assessment Report" submit button —
 * consistent with it being a separate, more consequential action. This test only confirms the
 * button is reachable and enabled (matching the Courses suite's TC047 precedent for
 * "Create Schedule": present and enabled, never actually clicked through with real data).
 */
test('TC026 - Verify "Generate Report Cards" is present, enabled, and distinctly styled (not exercised further)', async ({ page }) => {
  const reports = new ReportsPage(page);
  await loginAs(page);
  await reports.gotoAssessment();

  await expect(reports.generateReportCardsButton()).toBeVisible();
  await expect(reports.generateReportCardsButton()).toBeEnabled();

  const generateClass = (await reports.generateReportCardsButton().getAttribute('class')) || '';
  const downloadClass = (await reports.downloadAssessmentReportButton().getAttribute('class')) || '';
  expect(generateClass).not.toBe(downloadClass);
});
