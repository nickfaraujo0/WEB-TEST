// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, exitWizard, DSA } from './courses-helpers.js';

test('TC044 - Verify Step 2 offers "Bulk import via CSV" (recommended) and "Add manually"', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.editScheduleButton.click();
  await courses.wizardNextButton().click();

  await expect(page.getByText('Add topic sequence', { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(courses.bulkImportCsvCard()).toBeVisible();
  await expect(page.getByText('RECOMMENDED', { exact: true })).toBeVisible();
  await expect(courses.addManuallyCard()).toBeVisible();

  await exitWizard(courses);
});
