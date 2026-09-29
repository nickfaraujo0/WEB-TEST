// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor, loginAsStudent } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC057 —
 * Verify "Submit Course Feedback" with a pending count is shown to the Student and not to the Professor.
 *
 * Confirmed live 2026-09-29: the student sees "Submit Course Feedback" followed by a count badge (9 at the
 * time); the professor sees "Check in On-Duty Students" in that spot instead.
 */
test('TC057 - Verify "Submit Course Feedback" with a pending count is shown to the Student and not to the Professor', async ({ page, browser }) => {
  await loginAsStudent(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await expect(tabs.submitFeedbackButton()).toBeVisible();
  const badge = tabs.submitFeedbackButton().locator('xpath=following::*[normalize-space()][1]');
  await expect(badge).toHaveText(/^\d+$/);

  const context = await browser.newContext();
  try {
    const prof = await context.newPage();
    await loginAsProfessor(prof);
    const profTabs = new CourseTabsPage(prof);
    await profTabs.goto();
    await expect(profTabs.onDutyButton()).toBeVisible({ timeout: 30000 });
    await expect(profTabs.submitFeedbackButton()).toHaveCount(0);
  } finally {
    await context.close();
  }
});
