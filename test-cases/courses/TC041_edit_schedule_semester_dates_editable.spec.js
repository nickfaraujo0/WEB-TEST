// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, exitWizard, DSA } from './courses-helpers.js';

test('TC041 - Verify Edit Schedule Step 1 shows editable Semester start/end dates', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.editScheduleButton.click();

  await expect(page.getByText('Review division details', { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(courses.semesterStartInput()).toBeVisible();
  await expect(courses.semesterEndInput()).toBeVisible();
  await expect(courses.semesterStartInput()).toBeEditable();

  await exitWizard(courses);
});
