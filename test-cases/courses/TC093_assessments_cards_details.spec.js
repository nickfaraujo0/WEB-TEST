// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC093 —
 * Verify the Assessments tab lists each assessment with its details and counts.
 *
 * Confirmed live 2026-09-29: each card shows its name (IT1, IT2), "Internal Tests • Total Marks 500", "Graded"
 * and Present / Absent / Withheld counts.
 */
test('TC093 - Verify the Assessments tab lists each assessment with its details and counts', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Assessments');
  await expect(page.getByText('Add Assessment', { exact: true }).first()).toBeVisible({ timeout: 20000 });
  const meta = page.getByText(/ • Total Marks \d+$/);
  await expect(meta.first()).toBeVisible();
  const cards = await meta.count();
  expect(cards).toBeGreaterThan(0);
  await expect(page.getByText('IT1', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Graded', { exact: true })).toHaveCount(cards);
  // Each count renders as one paragraph, e.g. "Present 1" or "Present -" before marks exist.
  for (const label of ['Present', 'Absent', 'Withheld']) {
    await expect(page.getByText(new RegExp(`^${label} (\\d+|-)$`))).toHaveCount(cards);
  }
});
