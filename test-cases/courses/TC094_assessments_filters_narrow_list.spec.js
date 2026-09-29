// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC094 —
 * Verify the "All" and "All types" filters narrow the assessment list.
 *
 * Confirmed live 2026-09-29: "All" is a status select (All / Draft / In progress / Graded); "All types" a
 * type select (EndSemester, Internal Tests, Class Test, …). Every assessment here is an Internal Test.
 */
test('TC094 - Verify the "All" and "All types" filters narrow the assessment list', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Assessments');
  await expect(page.getByText('Add Assessment', { exact: true }).first()).toBeVisible({ timeout: 20000 });
  const option = (name) => page.locator('.ant-select-item-option').filter({ hasText: new RegExp(`^${name}$`) });

  await page.getByText('All', { exact: true }).first().click();
  await option('Draft').click();
  await expect(page.getByText('Continue Entering Marks', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Continue Creating Assessment', { exact: true }).first()).toBeVisible();

  await page.getByText('All types', { exact: true }).click();
  await option('Class Test').click();
  await expect(page.getByText(/^Internal Tests • Total Marks/)).toHaveCount(0);
});
