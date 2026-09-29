// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from '../_session.mjs';
import { openStudentCourse } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC081 —
 * Verify "Search by name or roll no." filters the participant list.
 *
 * Confirmed live 2026-09-29: "Three" leaves only Three Student; roll "4" leaves only Four Student.
 */
test('TC081 - Verify "Search by name or roll no." filters the participant list', async ({ page }) => {
  await loginAsStudent(page);
  const tabs = await openStudentCourse(page);
  await tabs.openSubTab('Students');
  await expect(page.getByText('All Participants', { exact: true })).toBeVisible({ timeout: 20000 });
  await tabs.participantSearch().fill('Three');
  await expect(page.getByText('Three Student', { exact: true })).toBeVisible();
  await expect(page.getByText('One Student', { exact: true })).toHaveCount(0);
  await expect(page.getByText('1 students', { exact: true })).toBeVisible();

  await tabs.participantSearch().fill('4');
  await expect(page.getByText('Four Student', { exact: true })).toBeVisible();
  await expect(page.getByText('Three Student', { exact: true })).toHaveCount(0);
});
