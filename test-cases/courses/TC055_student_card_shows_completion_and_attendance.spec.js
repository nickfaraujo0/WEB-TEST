// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC055 —
 * Verify a student's course card shows % course completed and Student Attendance %.
 *
 * Confirmed live 2026-09-29: each student card shows "N% course completed" and "Student Attendance" with a
 * percentage (e.g. ME101 / Div A: 17% and 93%).
 */
test('TC055 - Verify a student\'s course card shows % course completed and Student Attendance %', async ({ page }) => {
  await loginAsStudent(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  const completed = page.getByText(/^\d+% course completed$/);
  await expect(completed.first()).toBeVisible({ timeout: 60000 });
  const cards = await completed.count();
  await expect(page.getByText('Student Attendance', { exact: true })).toHaveCount(cards);
  await expect(page.getByText(/^\d+%$/)).toHaveCount(cards);
});
