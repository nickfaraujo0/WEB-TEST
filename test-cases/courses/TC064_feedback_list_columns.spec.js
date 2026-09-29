// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC064 —
 * Verify "Submit Course Feedback" opens "Your course feedbacks" with its columns.
 *
 * Confirmed live 2026-09-29: /Courses/coursesFeedback lists every course with these six columns.
 */
test('TC064 - Verify "Submit Course Feedback" opens "Your course feedbacks" with its columns', async ({ page }) => {
  await loginAsStudent(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await tabs.submitFeedbackButton().click();
  await expect(page).toHaveURL(/\/Courses\/coursesFeedback/, { timeout: 20000 });
  await expect(page.getByText('Your course feedbacks', { exact: true })).toBeVisible();
  for (const col of ['Course', 'No. of Faculties', 'Completion', 'Type', 'Due Date / Submitted On', 'Status']) {
    await expect(page.getByText(new RegExp(`^${col.replace(/[./]/g, '\\$&')}$`, 'i')).first()).toBeVisible();
  }
});
