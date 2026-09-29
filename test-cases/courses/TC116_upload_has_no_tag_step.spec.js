// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT, withQaResource } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC116 —
 * Verify a file can be tagged with a category while uploading, and found by that tag (gap).
 *
 * GAP, confirmed live 2026-09-29: picking a file uploads it immediately — there is no tag/category step.
 * Asserts the gap (passes while it stands). Always deletes the file.
 */
test('TC116 - Verify a file can be tagged with a category while uploading, and found by that tag (gap)', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Resources');
  await expect(tabs.uploadLocalButton()).toBeVisible({ timeout: 20000 });
  await withQaResource(tabs, async () => {
    await expect(page.getByText(/\btag\b|categor/i)).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
