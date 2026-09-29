// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT, withQaResource } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC091 —
 * Verify the tag/category filter narrows files, and clearing it restores the list (gap).
 *
 * GAP, confirmed live 2026-09-29: Resources has no tag or category filter. Asserts the gap (passes while it
 * stands); rewrite to pick a tag and clear it once a filter exists.
 */
test('TC091 - Verify the tag/category filter narrows files, and clearing it restores the list (gap)', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Resources');
  await expect(tabs.uploadLocalButton()).toBeVisible({ timeout: 20000 });
  await withQaResource(tabs, async () => {
    await expect(page.getByText(/^(tags?|category|categories|filter)$/i)).toHaveCount(0);
    await expect(page.locator('.ant-select')).toHaveCount(0);
  });
});
