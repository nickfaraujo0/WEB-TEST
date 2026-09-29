// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC069 —
 * Verify "Course Info" opens Course Settings with every field.
 *
 * Confirmed live 2026-09-29 on DSA-123. Closed without saving.
 */
test('TC069 - Verify "Course Info" opens Course Settings with every field', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.courseInfoButton.click();
  const settings = tabs.courseSettings();
  await expect(settings).toBeVisible();
  for (const label of ['Change Image', 'Course Name', 'Course Type', 'Course Description', 'Course Code', 'Branch', 'Semester', 'Save Changes']) {
    await expect(settings.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(settings.getByText(/^\d+ Course Outcomes$/)).toBeVisible();
  await expect(settings.getByText(/^\d+ Rubrics$/)).toBeVisible();
  await expect(settings.locator(`input[value="${DSA_ASSESSMENT.course}"]`)).toBeVisible();
  await expect(settings.locator(`input[value="${DSA_ASSESSMENT.code}"]`)).toBeVisible();
  await tabs.modalClose('Course Settings').click();
  await expect(settings).toBeHidden();
});
