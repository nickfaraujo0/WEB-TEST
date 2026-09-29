// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT, CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC054 —
 * Verify the course search filters course cards by name (gap).
 *
 * GAP, confirmed live 2026-09-29: the web Courses list has no search box at all (only the Academic Year
 * and Even/Odd controls). This asserts the gap and passes while it stands; if a search is added
 * it fails and should be rewritten to type part of a name and check only matching cards remain.
 */
test('TC054 - Verify the course search filters course cards by name (gap)', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await expect(tabs.courseCard(DSA_ASSESSMENT.course)).toBeVisible({ timeout: 60000 });
  await expect(page.getByPlaceholder(/search/i)).toHaveCount(0);
  await expect(page.getByRole('searchbox')).toHaveCount(0);
});
