// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT, withQaResource } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC086 —
 * Verify uploading a local file adds it to the Resources list with its name.
 *
 * Confirmed live 2026-09-29: the file uploads straight away ("Uploading Files … N%") and is listed with its
 * name and type. Uses a uniquely named copy of a small PDF and always deletes it afterwards.
 */
test('TC086 - Verify uploading a local file adds it to the Resources list with its name', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Resources');
  await expect(tabs.uploadLocalButton()).toBeVisible({ timeout: 20000 });
  await withQaResource(tabs, async (name) => {
    await expect(tabs.resourceRow(name)).toContainText('application/pdf');
  });
});
