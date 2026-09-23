// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/**
 * Correction to an assumption carried over from earlier exploration: Exit is NOT silent.
 * Confirmed live at the Preview step: clicking "Exit" shows "All changes will be lost — Are
 * you sure you wish to leave? All unsaved changes will be lost." with Cancel/Close, even
 * though this run made no further edits beyond stepping through Next/Skip For Now.
 */
test('TC046 - Verify exiting the Edit Schedule wizard shows an "All changes will be lost" confirmation', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.editScheduleButton.click();
  await courses.wizardNextButton().click();
  await courses.skipForNowButton().click();
  await expect(page.getByText('Preview your schedule', { exact: true })).toBeVisible({ timeout: 15000 });

  await courses.wizardExitButton().click();
  await expect(courses.wizardExitConfirmDialog()).toBeVisible();
  await expect(courses.wizardExitConfirmDialog().getByText('Are you sure you wish to leave?', { exact: false })).toBeVisible();

  await courses.wizardExitConfirmCancelButton().click();
  await expect(page.getByText('Preview your schedule', { exact: true })).toBeVisible();

  await courses.wizardExitButton().click();
  await courses.wizardExitConfirmCloseButton().click();
});
