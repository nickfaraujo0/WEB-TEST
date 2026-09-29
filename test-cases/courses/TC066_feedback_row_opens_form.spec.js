// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC066 —
 * Verify opening a pending course's feedback shows the feedback form.
 *
 * Seen live 2026-09-29: clicking a pending row (it has cursor-pointer and a hover shadow) did NOT open any
 * form or navigate in a real run — this is expected to fail until that works. Nothing is
 * submitted.
 */
test('TC066 - Verify opening a pending course\'s feedback shows the feedback form', async ({ page }) => {
  await loginAsStudent(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await tabs.submitFeedbackButton().click();
  await expect(page).toHaveURL(/\/Courses\/coursesFeedback/, { timeout: 20000 });
  await tabs.feedbackRow('Economics 101').click();
  await expect
    .poll(async () => !/coursesFeedback\/?$/.test(page.url()) || (await page.getByRole('dialog').count()) > 0, { timeout: 15000 })
    .toBe(true);
});
