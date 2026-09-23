// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/** Confirmed live: "Assessment test" has zero sessions ("No sessions yet!"); "BLE Test V1.1"
 * has real ones — switching between them must swap the whole list, not merge it. */
test('TC003 - Verify selecting a different division loads that division\'s own session list', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, 'Assessment test');
  await expect(courses.noSessionsYetHeading).toBeVisible();

  await courses.divisionTab(DSA.division).click();
  await expect(courses.noSessionsYetHeading).toBeHidden();
  await expect(courses.cardByText('Untitled session').first()).toBeVisible();
});
