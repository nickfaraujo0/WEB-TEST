// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT, CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC052 —
 * Verify the Courses list shows "Your courses" with the Academic Year and Even/Odd semester switch.
 *
 * Confirmed live 2026-09-29: the list shows "Your courses", "Academic Year: 2025-26", Even and Odd pills and the course cards.
 */
test('TC052 - Verify the Courses list shows "Your courses" with the Academic Year and Even/Odd semester switch', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await expect(tabs.yourCoursesHeading).toBeVisible();
  await expect(page.getByText(/^Academic Year: \d{4}-\d{2}$/)).toBeVisible();
  await expect(tabs.semesterPill('Even')).toBeVisible();
  await expect(tabs.semesterPill('Odd')).toBeVisible();
  await expect(tabs.courseCard(DSA_ASSESSMENT.course)).toBeVisible({ timeout: 60000 });
});
