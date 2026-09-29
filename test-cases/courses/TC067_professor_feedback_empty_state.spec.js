// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC067 —
 * Verify the Professor's Feedback tab shows an empty state when there are no responses.
 *
 * Confirmed live 2026-09-29 on DSA-123 / "Assessment test" (no students, so no responses).
 */
test('TC067 - Verify the Professor\'s Feedback tab shows an empty state when there are no responses', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Feedback');
  await expect(page.getByText('Your feedback will show up here', { exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/^Student responses will appear once they.re submitted\.$/)).toBeVisible();
});
