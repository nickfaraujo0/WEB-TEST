// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';
import { withLock } from '../_lock.mjs';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC085 —
 * Verify the Professor's Resources tab shows "No files" with both upload options.
 *
 * Confirmed live 2026-09-29. Takes the Resources lock so an upload test can't add a file mid-check.
 */
test('TC085 - Verify the Professor\'s Resources tab shows "No files" with both upload options', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Resources');
  await expect(tabs.uploadLocalButton()).toBeVisible({ timeout: 20000 });
  await withLock('courses-resources', async () => {
    await page.reload();
    await expect(tabs.uploadLocalButton()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('No files', { exact: true })).toBeVisible();
    await expect(tabs.uploadDriveButton()).toBeVisible();
  });
});
