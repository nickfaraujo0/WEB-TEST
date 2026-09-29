// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC088 —
 * Verify "Upload From Google Drive" opens the Google Drive picker.
 *
 * Seen live 2026-09-29: in an automated browser, clicking it opened no popup, iframe or dialog within 8s.
 * This expects a Google sign-in popup or picker; nothing is completed.
 */
test('TC088 - Verify "Upload From Google Drive" opens the Google Drive picker', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Resources');
  await expect(tabs.uploadLocalButton()).toBeVisible({ timeout: 20000 });
  const popup = page.context().waitForEvent('page', { timeout: 15000 }).then(() => true, () => false);
  await tabs.uploadDriveButton().click();
  const picker = page.locator('iframe[src*="google.com"], .picker-dialog').first();
  const opened = await Promise.race([popup, picker.waitFor({ state: 'visible', timeout: 15000 }).then(() => true, () => false)]);
  expect(opened, 'a Google Drive popup or picker should open').toBe(true);
});
