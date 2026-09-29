// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC099 —
 * Verify "Continue Entering Marks" reopens marks entry with the saved counts.
 *
 * Seen live 2026-09-29: the card says Present 1 / Absent 1, but marks entry shows "doesn't have any students
 * yet" and no saved entries (the division no longer has students). Expected to fail while that
 * mismatch stands.
 */
test('TC099 - Verify "Continue Entering Marks" reopens marks entry with the saved counts', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Assessments');
  await expect(page.getByText('Add Assessment', { exact: true }).first()).toBeVisible({ timeout: 20000 });
  await page.getByText('Continue Entering Marks', { exact: true }).first().click();
  await expect(page).toHaveURL(/createAssessments\/marks/, { timeout: 20000 });
  await expect(page.getByText('No students found for this assessment', { exact: true })).toHaveCount(0, { timeout: 10000 });
  await expect(page.getByText(/^(Present|Absent)$/).first()).toBeVisible();
});
