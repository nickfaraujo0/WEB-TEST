// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC070 —
 * Verify Course Type Theory and Practical are mutually exclusive.
 *
 * Confirmed live 2026-09-29: Course Type is an antd radio group (Theory checked on DSA-123). Closed without
 * saving, so the course keeps its type.
 */
test('TC070 - Verify Course Type Theory and Practical are mutually exclusive', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.courseInfoButton.click();
  const settings = tabs.courseSettings();
  await expect(settings).toBeVisible();
  const original = (await tabs.courseTypeRadio('Theory').isChecked()) ? 'Theory' : 'Practical';
  const other = original === 'Theory' ? 'Practical' : 'Theory';
  await settings.getByText(other, { exact: true }).click();
  await expect(tabs.courseTypeRadio(other)).toBeChecked();
  await expect(tabs.courseTypeRadio(original)).not.toBeChecked();
  await settings.getByText(original, { exact: true }).click();
  await expect(tabs.courseTypeRadio(original)).toBeChecked();
  await expect(tabs.courseTypeRadio(other)).not.toBeChecked();
  await tabs.modalClose('Course Settings').click();
  await expect(settings).toBeHidden();
});
