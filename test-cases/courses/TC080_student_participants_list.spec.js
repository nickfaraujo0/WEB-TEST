// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from '../_session.mjs';
import { openStudentCourse } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC080 —
 * Verify the Student's Students tab lists participants with batch count and columns.
 *
 * Confirmed live 2026-09-29 on ME101 / Div A: 4 batches, "Showing 4 students", Student / Batch / Attendance.
 */
test('TC080 - Verify the Student\'s Students tab lists participants with batch count and columns', async ({ page }) => {
  await loginAsStudent(page);
  const tabs = await openStudentCourse(page);
  await tabs.openSubTab('Students');
  await expect(page.getByText('All Participants', { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('Number of Batches', { exact: true })).toBeVisible();
  await expect(page.getByText(/^\d+ students$/)).toBeVisible();
  for (const col of ['Student', 'Batch', 'Attendance']) {
    await expect(page.getByText(new RegExp(`^${col}$`, 'i')).first()).toBeVisible();
  }
});
