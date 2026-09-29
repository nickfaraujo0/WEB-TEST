// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC073 —
 * Verify "View" on Course Outcomes lists the course's outcomes.
 *
 * Confirmed live 2026-09-29: "4 Course Outcomes" → View lists DSA101.1 … DSA101.4 with descriptions.
 */
test('TC073 - Verify "View" on Course Outcomes lists the course\'s outcomes', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.courseInfoButton.click();
  const settings = tabs.courseSettings();
  await expect(settings).toBeVisible();
  const label = await settings.getByText(/^\d+ Course Outcomes$/).innerText();
  const count = parseInt(label, 10);
  await tabs.viewButton(0).click();
  await expect(page.getByText(/^DSA101\.\d+$/)).toHaveCount(count, { timeout: 15000 });
});
