// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC096 —
 * Verify "Add Assessment" offers uploading a question paper or adding questions manually.
 *
 * Confirmed live 2026-09-29: "Autofill Questions" — .pdf, .doc, .docx or image, "Upload Question Paper" or
 * "Add Questions Manually". Closed without choosing.
 */
test('TC096 - Verify "Add Assessment" offers uploading a question paper or adding questions manually', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Assessments');
  await expect(page.getByText('Add Assessment', { exact: true }).first()).toBeVisible({ timeout: 20000 });
  await page.getByText('Add Assessment', { exact: true }).first().click();
  await expect(page.getByText('Autofill Questions', { exact: true })).toBeVisible();
  await expect(page.getByText(/\.pdf, \.doc, \.docx, or image files/)).toBeVisible();
  await expect(page.getByText('Upload Question Paper', { exact: true })).toBeVisible();
  await expect(page.getByText('Add Questions Manually', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
});
