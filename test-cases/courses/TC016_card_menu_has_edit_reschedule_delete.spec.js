// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

test('TC016 - Verify a session card\'s "..." menu opens with Edit/Reschedule/Delete Session', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  const card = courses.cardByText('Untitled session').first();

  await courses.cardMenuTrigger(card).click();
  await expect(courses.menuItem('Edit Session')).toBeVisible();
  await expect(courses.menuItem('Reschedule Session')).toBeVisible();
  await expect(courses.menuItem('Delete Session')).toBeVisible();
});
