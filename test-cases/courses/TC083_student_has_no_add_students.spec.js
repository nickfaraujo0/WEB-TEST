// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from '../_session.mjs';
import { openStudentCourse } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC083 —
 * Verify the Student has no "Add Students" control.
 *
 * Confirmed live 2026-09-29.
 */
test('TC083 - Verify the Student has no "Add Students" control', async ({ page }) => {
  await loginAsStudent(page);
  const tabs = await openStudentCourse(page);
  await tabs.openSubTab('Students');
  await expect(page.getByText('All Participants', { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('Add Students', { exact: true })).toHaveCount(0);
});
