// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, exitWizard, DSA } from './courses-helpers.js';

/** Confirmed live: Monday already had a slot ("B3, B1 / 12:00 - 01:00 AM / Tutorial • uui •
 * Nilesh Sutttar") rendered as a card with a remove (x); every other day shows a bare
 * "+ Add Time Slot" link. Note the real data's own typo: "Sutttar" (three t's), confirmed via
 * a real run's accessibility snapshot — not "Suttar", which an earlier version of this test
 * had and which then never matched anything. */
test('TC042 - Verify Step 1\'s weekly grid shows one row per day with slots or "Add Time Slot"', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.editScheduleButton.click();
  await expect(page.getByText('Add your timetable', { exact: true })).toBeVisible({ timeout: 15000 });

  for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) {
    await expect(page.getByText(day, { exact: true })).toBeVisible();
  }
  await expect(page.getByText('Tutorial • uui • Nilesh Sutttar', { exact: true })).toBeVisible();
  await expect(courses.addTimeSlotLink('Tuesday')).toBeVisible();

  await exitWizard(courses);
});
