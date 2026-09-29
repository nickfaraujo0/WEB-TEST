// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC097 —
 * Verify "Add Questions Manually" opens the assessment builder.
 *
 * Confirmed live 2026-09-29: it opens the "Add Assessment" form (Assessment Type, Grading, Rubric,
 * Assessment Date). Cancelled, so nothing is created.
 */
test('TC097 - Verify "Add Questions Manually" opens the assessment builder', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Assessments');
  await expect(page.getByText('Add Assessment', { exact: true }).first()).toBeVisible({ timeout: 20000 });
  const before = await page.getByText(/ • Total Marks \d+$/).count();
  await page.getByText('Add Assessment', { exact: true }).first().click();
  await page.getByText('Add Questions Manually', { exact: true }).click();
  const form = page.locator('.ant-modal-content').filter({ hasText: 'Fill in the basics' });
  await expect(form).toBeVisible();
  for (const label of ['Assessment Type', 'Grading', 'Rubric', 'Assessment Date', 'Create Assessment']) {
    await expect(form.getByText(label, { exact: true })).toBeVisible();
  }
  const gotIt = page.getByText('Got it', { exact: true });
  if (await gotIt.isVisible().catch(() => false)) await gotIt.click();
  await form.getByText('Cancel', { exact: true }).click();
  await expect(form).toBeHidden();
  await expect(page.getByText(/ • Total Marks \d+$/)).toHaveCount(before);
});
