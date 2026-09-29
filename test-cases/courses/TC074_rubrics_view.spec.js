// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC074 —
 * Verify "View" on Rubrics lists the course's rubrics.
 *
 * Confirmed live 2026-09-29: "9 Rubrics" → View lists each rubric as "N criteria · max M". The View button
 * animates in, so the click waits for the dialog to settle first.
 */
test('TC074 - Verify "View" on Rubrics lists the course\'s rubrics', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.courseInfoButton.click();
  const settings = tabs.courseSettings();
  await expect(settings).toBeVisible();
  const label = await settings.getByText(/^\d+ Rubrics$/).innerText();
  const count = parseInt(label, 10);
  await page.waitForTimeout(800); // modal open animation — a real run saw "element is not stable"
  await tabs.viewButton(1).click({ force: true });
  await expect(page.getByText(/^\d+ criteria · max \d+$/)).toHaveCount(count, { timeout: 15000 });
});
