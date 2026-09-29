// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT, withQaResource } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC089 —
 * Verify clicking an uploaded file opens or downloads it.
 *
 * Uploads a throwaway PDF, clicks the row's download button (the icon left of the red delete) and expects a
 * download or a new tab. Always deletes the file.
 */
test('TC089 - Verify clicking an uploaded file opens or downloads it', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Resources');
  await expect(tabs.uploadLocalButton()).toBeVisible({ timeout: 20000 });
  await withQaResource(tabs, async (name) => {
    const download = page.waitForEvent('download', { timeout: 20000 }).then(() => true, () => false);
    const popup = page.context().waitForEvent('page', { timeout: 20000 }).then(() => true, () => false);
    await tabs.resourceRow(name).locator('div.cursor-pointer').first().click();
    expect(await Promise.race([download, popup])).toBe(true);
  });
});
