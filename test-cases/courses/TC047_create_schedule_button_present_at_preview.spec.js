// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, exitWizard, DSA } from './courses-helpers.js';

/**
 * "Create Schedule" regenerates every week of the semester for the whole division — a
 * semester-wide, effectively irreversible action. This suite only confirms the button is
 * present and reachable; it deliberately does not click it (needs a disposable
 * course/division scoped for this before that path can be exercised safely).
 */
test('TC047 - Verify "Create Schedule" is reachable at the Preview step (not exercised)', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.editScheduleButton.click();
  await courses.wizardNextButton().click();
  await courses.skipForNowButton().click();

  await expect(courses.createScheduleButton()).toBeVisible({ timeout: 15000 });
  await expect(courses.createScheduleButton()).toBeEnabled();

  await exitWizard(courses);
});
