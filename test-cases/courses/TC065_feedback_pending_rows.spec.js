// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC065 —
 * Verify each unsubmitted course shows "Action required", 0/N completion and a due date.
 *
 * Confirmed live 2026-09-29: e.g. Mechanics of Solids — 3 faculties, 0/3, Theory, 31 Oct 2026, Action required.
 */
test('TC065 - Verify each unsubmitted course shows "Action required", 0/N completion and a due date', async ({ page }) => {
  await loginAsStudent(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await tabs.submitFeedbackButton().click();
  await expect(page).toHaveURL(/\/Courses\/coursesFeedback/, { timeout: 20000 });
  const row = tabs.feedbackRow('Mechanics of Solids');
  await expect(row).toBeVisible();
  await expect(row).toContainText(/0\/\d+/);
  await expect(row).toContainText(/\d{1,2} [A-Z][a-z]{2} \d{4}/);
  await expect(row).toContainText('Action required');
});
