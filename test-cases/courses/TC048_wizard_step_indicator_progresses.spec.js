// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, exitWizard, DSA } from './courses-helpers.js';

/** Confirmed live: the step-indicator's own labels ("Add Timetable", "Preview") each render
 * 3 identical `<span>`s at once (likely a responsive-breakpoint duplicate), so an unscoped
 * `getByText(..., {exact:true})` hits a strict-mode violation. `.first()` still proves the
 * label is present. */
test('TC048 - Verify the 3-step indicator (Add Timetable / Add Topic Sequence / Preview) updates', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.editScheduleButton.click();

  await expect(page.getByText('Add Timetable', { exact: true }).first()).toBeVisible({ timeout: 15000 });
  await courses.wizardNextButton().click();
  await expect(page.getByText('Add Topic', { exact: false }).first()).toBeVisible({ timeout: 15000 });
  await courses.skipForNowButton().click();
  await expect(page.getByText('Preview', { exact: true }).first()).toBeVisible({ timeout: 15000 });

  await exitWizard(courses);
});
