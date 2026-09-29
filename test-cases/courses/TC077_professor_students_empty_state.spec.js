// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC077 —
 * Verify the Professor's Students tab shows an empty state with "Add Students" when the division has none.
 *
 * Confirmed live 2026-09-29 on DSA-123 / "Assessment test".
 */
test('TC077 - Verify the Professor\'s Students tab shows an empty state with "Add Students" when the division has none', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Students');
  await expect(page.getByText('No Students Added yet', { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(tabs.addStudentsButton()).toBeVisible();
});
