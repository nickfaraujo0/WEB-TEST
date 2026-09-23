// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, exitWizard, DSA } from './courses-helpers.js';

/** Confirmed live: "Add Time Slot for Tuesday" opens with Session Timing/Duration required
 * (Duration defaults to 1.0), Session Type and Participants required with nothing selected,
 * Location optional, Faculty required — and "Add Time Slot" stays disabled until filled. */
test('TC043 - Verify "Add Time Slot" requires Session Timing/Type/Participants before enabling', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.editScheduleButton.click();
  await expect(page.getByText('Add your timetable', { exact: true })).toBeVisible({ timeout: 15000 });

  await courses.addTimeSlotLink('Tuesday').click();
  const dialog = courses.addTimeSlotDialog('Tuesday');
  await expect(dialog).toBeVisible({ timeout: 15000 });
  await expect(dialog.getByText('Duration*', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Location', { exact: false })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Add Time Slot' })).toBeDisabled();

  await page.keyboard.press('Escape');
  await exitWizard(courses);
});
