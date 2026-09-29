// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from '../_session.mjs';
import { openStudentCourse } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC076 —
 * Verify the Student has no "Course Info" entry.
 *
 * Confirmed live 2026-09-29 on ME101 / Div A.
 */
test('TC076 - Verify the Student has no "Course Info" entry', async ({ page }) => {
  await loginAsStudent(page);
  const tabs = await openStudentCourse(page);
  await expect(tabs.courseInfoButton).toHaveCount(0);
});
