// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/** Confirmed live on "Assessment test" (a division with zero sessions): the empty state
 * offers both the semester-wide wizard and a single Add Session as alternatives. */
test('TC025 - Verify a division with no sessions offers "Set Up Your Semester" and "Add Session"', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, 'Assessment test');
  await expect(courses.noSessionsYetHeading).toBeVisible();
  await expect(courses.setUpSemesterButton).toBeVisible();
  await expect(courses.addSessionButton).toBeVisible();
});
