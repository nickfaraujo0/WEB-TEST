// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC071 —
 * Verify Course Description shows a character counter with a 250 limit.
 *
 * Confirmed live 2026-09-29: the textarea has maxlength=250 and an "N/250" counter. Closed without saving.
 */
test('TC071 - Verify Course Description shows a character counter with a 250 limit', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.courseInfoButton.click();
  const settings = tabs.courseSettings();
  await expect(settings).toBeVisible();
  const input = tabs.descriptionInput();
  const original = await input.inputValue();
  await expect(settings.getByText(`${original.length}/250`, { exact: true })).toBeVisible();

  await input.fill('x'.repeat(300));
  await expect(input).toHaveValue('x'.repeat(250));
  await expect(settings.getByText('250/250', { exact: true })).toBeVisible();
  await tabs.modalClose('Course Settings').click();
  await expect(settings).toBeHidden();
});
