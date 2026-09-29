// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT, withQaResource } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC090 —
 * Verify searching files returns matches, and "No records found" for no match (gap).
 *
 * GAP, confirmed live 2026-09-29: with a file uploaded, Resources shows only the file list and the two upload
 * buttons — no search box. This asserts the gap (passes while it stands); if a search is added it
 * fails and should be rewritten to search a name and a non-match.
 */
test('TC090 - Verify searching files returns matches, and "No records found" for no match (gap)', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Resources');
  await expect(tabs.uploadLocalButton()).toBeVisible({ timeout: 20000 });
  await withQaResource(tabs, async () => {
    await expect(page.getByPlaceholder(/search/i)).toHaveCount(0);
  });
});
