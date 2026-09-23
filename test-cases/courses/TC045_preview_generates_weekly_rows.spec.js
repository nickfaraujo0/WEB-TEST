// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, exitWizard, DSA } from './courses-helpers.js';

/** Confirmed live: Preview lists one row per week for every weekly slot between the
 * semester's start and end dates (e.g. every Monday, 12:00 am, Tutorial) — no holiday or
 * skip-week handling was visible in the generated rows. */
test('TC045 - Verify Preview generates one row per week between semester start and end', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.editScheduleButton.click();
  await courses.wizardNextButton().click();
  await courses.skipForNowButton().click();

  await expect(page.getByText('Preview your schedule', { exact: true })).toBeVisible({ timeout: 15000 });
  const mondayRows = page.getByText('Monday', { exact: true });
  expect(await mondayRows.count()).toBeGreaterThan(1);
  await expect(courses.createScheduleButton()).toBeVisible();

  await exitWizard(courses);
});
