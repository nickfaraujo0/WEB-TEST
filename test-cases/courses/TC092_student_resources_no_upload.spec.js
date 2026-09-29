// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from '../_session.mjs';
import { openStudentCourse } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC092 —
 * Verify the Student sees Resources without any upload options.
 *
 * Confirmed live 2026-09-29 on ME101 / Div A ("No files", no upload buttons).
 */
test('TC092 - Verify the Student sees Resources without any upload options', async ({ page }) => {
  await loginAsStudent(page);
  const tabs = await openStudentCourse(page);
  await tabs.openSubTab('Resources');
  await expect(page).toHaveURL(/\/Resources/);
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(tabs.uploadLocalButton()).toHaveCount(0);
  await expect(tabs.uploadDriveButton()).toHaveCount(0);
});
