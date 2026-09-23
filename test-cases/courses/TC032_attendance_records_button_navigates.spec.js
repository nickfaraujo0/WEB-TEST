// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

test('TC032 - Verify Attendance Records button navigates to that session\'s attendance history', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);
  const card = courses.cardByText('George Fernandes').filter({ hasText: 'Practical' }).first();

  await courses.cardMenuTrigger(card).click();
  await courses.menuItem('Edit Session').click();
  await expect(courses.sessionDetailsHeading()).toBeVisible({ timeout: 15000 });

  await courses.attendanceRecordsButton().click();
  await expect(courses.sessionDetailsHeading()).toBeHidden({ timeout: 15000 });
});
