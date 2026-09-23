// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

test('TC005 - Verify the course header (name + code) stays constant across divisions', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await expect(page.getByText(DSA.course, { exact: true })).toBeVisible();
  await expect(page.getByText('DSA-123', { exact: true })).toBeVisible();

  await courses.divisionTab('Assessment test').click();
  await expect(page.getByText(DSA.course, { exact: true })).toBeVisible();
  await expect(page.getByText('DSA-123', { exact: true })).toBeVisible();
});
