// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from '../_session.mjs';
import { openStudentCourse } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC082 —
 * Verify a Student sees only their own attendance percentage, not classmates'.
 *
 * Confirmed live 2026-09-29: only the signed-in student's row (Three Student, 93.33%) has a percentage.
 */
test('TC082 - Verify a Student sees only their own attendance percentage, not classmates\'', async ({ page }) => {
  await loginAsStudent(page);
  const tabs = await openStudentCourse(page);
  await tabs.openSubTab('Students');
  await expect(page.getByText('All Participants', { exact: true })).toBeVisible({ timeout: 20000 });
  const rows = parseInt(await page.getByText(/^\d+ students$/).innerText(), 10);
  expect(rows).toBeGreaterThan(1);
  await expect(page.getByText(/^\d+(\.\d+)?%$/)).toHaveCount(1);
});
