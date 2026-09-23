// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

test('TC004 - Verify the hamburger icon collapses and expands the Divisions sidebar', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await expect(courses.divisionsLabel).toBeVisible();

  await courses.hamburgerToggle.click();
  await expect(courses.divisionsLabel).toBeHidden();

  await courses.hamburgerToggle.click();
  await expect(courses.divisionsLabel).toBeVisible();
});
