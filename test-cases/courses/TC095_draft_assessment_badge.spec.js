// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC095 —
 * Verify draft assessments show a "Draft" badge and "Continue Creating Assessment".
 *
 * Confirmed live 2026-09-29: every "Draft" card offers "Continue Creating Assessment"; the rest offer "Enter
 * Marks" or "Continue Entering Marks".
 */
test('TC095 - Verify draft assessments show a "Draft" badge and "Continue Creating Assessment"', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Assessments');
  await expect(page.getByText('Add Assessment', { exact: true }).first()).toBeVisible({ timeout: 20000 });
  const drafts = await page.getByText('Draft', { exact: true }).count();
  expect(drafts).toBeGreaterThan(0);
  await expect(page.getByText('Continue Creating Assessment', { exact: true })).toHaveCount(drafts);
  const cards = await page.getByText(/ • Total Marks \d+$/).count();
  const marks = await page.getByText(/^(Enter Marks|Continue Entering Marks)$/).count();
  expect(marks).toBe(cards - drafts);
});
