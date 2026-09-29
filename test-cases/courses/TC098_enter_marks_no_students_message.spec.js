// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC098 —
 * Verify "Enter Marks" explains when the division has no students.
 *
 * Confirmed live 2026-09-29 on "Assessment test" (no students).
 */
test('TC098 - Verify "Enter Marks" explains when the division has no students', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Assessments');
  await expect(page.getByText('Add Assessment', { exact: true }).first()).toBeVisible({ timeout: 20000 });
  await page.getByText('Enter Marks', { exact: true }).first().click();
  await expect(page).toHaveURL(/createAssessments\/marks/, { timeout: 20000 });
  await expect(page.getByText(new RegExp(`^${DSA_ASSESSMENT.division} doesn.t have any students yet\\.$`))).toBeVisible();
  await expect(page.getByText(/^You.ll be able to enter marks once students have been added/)).toBeVisible();
});
