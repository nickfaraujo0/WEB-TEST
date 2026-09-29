// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC101 —
 * Verify the course sub-tabs are grouped under Teach, Drive Engagement and Evaluate.
 *
 * Confirmed live 2026-09-29 (professor view).
 */
test('TC101 - Verify the course sub-tabs are grouped under Teach, Drive Engagement and Evaluate', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  const groups = { Teach: ['Schedule/Lesson Plan', 'Students'], 'Drive Engagement': ['Messages', 'Feedback', 'Resources'], Evaluate: ['Assessments'] };
  for (const [group, pills] of Object.entries(groups)) {
    const box = tabs.subTabGroup(group).locator('..');
    await expect(box).toBeVisible();
    for (const pill of pills) {
      await expect(box.locator('div.rounded-full.cursor-pointer', { hasText: new RegExp(`^${pill}$`) })).toBeVisible();
    }
  }
});
