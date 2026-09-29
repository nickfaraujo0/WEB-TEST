// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from '../_session.mjs';
import { openStudentCourse } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC068 —
 * Verify the Student's Feedback tab uses student-appropriate wording (bug?).
 *
 * BUG, seen live 2026-09-29: the student sees the professor's empty state, "Your feedback will show up
 * here / Student responses will appear once they're submitted." This asserts the professor-facing
 * line is absent, so it fails while the bug stands.
 */
test('TC068 - Verify the Student\'s Feedback tab uses student-appropriate wording (bug?)', async ({ page }) => {
  await loginAsStudent(page);
  const tabs = await openStudentCourse(page);
  await tabs.openSubTab('Feedback');
  await expect(page).toHaveURL(/\/Feedback/);
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page.getByText(/Student responses will appear once they.re submitted/)).toHaveCount(0, { timeout: 10000 });
});
