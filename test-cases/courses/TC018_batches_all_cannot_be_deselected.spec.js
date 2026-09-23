// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/** Confirmed live: clicking the default "All" batch pill again does not deselect it — it
 * stays the selected (bordered) pill regardless. */
test('TC018 - Verify the default "All" Batches pill cannot be deselected by clicking it again', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.addSessionButton.click();

  await courses.batchPill('All').click();
  await expect(courses.batchPill('All')).toHaveClass(/bg-subtleBlue/);
});
