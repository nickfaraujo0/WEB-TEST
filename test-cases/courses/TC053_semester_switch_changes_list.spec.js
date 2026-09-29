// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { CourseTabsPage } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC053 —
 * Verify switching Even/Odd changes the course list for that semester.
 *
 * Confirmed live 2026-09-29: picking the other semester pill changes the "sem" URL parameter (the list is
 * loaded for that semester). Which pill is active depends on the date, so this clicks Odd and
 * falls back to Even if Odd was already the active one.
 */
test('TC053 - Verify switching Even/Odd changes the course list for that semester', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = new CourseTabsPage(page);
  await tabs.goto();
  const sem = () => new URL(page.url()).searchParams.get('sem');
  await expect.poll(sem, { timeout: 20000 }).not.toBeNull();
  const before = sem();

  await tabs.semesterPill('Odd').click();
  const changed = await expect.poll(sem, { timeout: 8000 }).not.toBe(before).then(() => true, () => false);
  if (!changed) {
    await tabs.semesterPill('Even').click();
    await expect.poll(sem, { timeout: 15000 }).not.toBe(before);
  }
  await expect(tabs.yourCoursesHeading).toBeVisible();
});
