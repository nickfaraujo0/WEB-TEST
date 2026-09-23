// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

test('TC001 - Verify the Divisions sidebar lists every division in the course', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course);
  await expect(courses.divisionsLabel).toBeVisible();
  await expect(courses.divisionTab(DSA.division)).toBeVisible();
  await expect(courses.divisionTab('Assessment test')).toBeVisible();
});
