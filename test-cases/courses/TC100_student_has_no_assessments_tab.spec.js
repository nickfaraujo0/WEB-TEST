// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from '../_session.mjs';
import { openStudentCourse } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC100 —
 * Verify the Student has no Assessments tab.
 *
 * Confirmed live 2026-09-29: the student's sub-tabs are Schedule/Lesson Plan, Students (under "Learn") and
 * Messages, Feedback, Resources (under "Engage").
 */
test('TC100 - Verify the Student has no Assessments tab', async ({ page }) => {
  await loginAsStudent(page);
  const tabs = await openStudentCourse(page);
  for (const name of ['Schedule/Lesson Plan', 'Students', 'Messages', 'Feedback', 'Resources']) {
    await expect(tabs.subTab(name)).toBeVisible();
  }
  await expect(tabs.subTab('Assessments')).toHaveCount(0);
});
