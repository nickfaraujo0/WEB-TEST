// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor, loginAsStudent } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC056 —
 * Verify "Check in On-Duty Students" is shown to the Professor and not to the Student.
 *
 * Confirmed live 2026-09-29. The student is checked in a second, separate browser context.
 */
test('TC056 - Verify "Check in On-Duty Students" is shown to the Professor and not to the Student', async ({ page, browser }) => {
  await loginAsProfessor(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  await expect(tabs.onDutyButton()).toBeVisible();

  const context = await browser.newContext();
  try {
    const student = await context.newPage();
    await loginAsStudent(student);
    const studentTabs = new CourseTabsPage(student);
    await studentTabs.goto();
    await expect(studentTabs.submitFeedbackButton()).toBeVisible({ timeout: 30000 });
    await expect(studentTabs.onDutyButton()).toHaveCount(0);
  } finally {
    await context.close();
  }
});
