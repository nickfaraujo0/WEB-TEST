// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, withDisposableSession, DSA } from './courses-helpers.js';

test('TC036 - Verify Reschedule Session defaults "New date & time" to the session\'s current value', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);

  await withDisposableSession(page, courses, async (card) => {
    await courses.cardMenuTrigger(card).click();
    await courses.menuItem('Reschedule Session').click();

    await expect(courses.rescheduleDialog()).toBeVisible();
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    await expect(courses.rescheduleDateTimeInput()).toHaveValue(new RegExp(today));
    await courses.rescheduleCancelButton().click();
  });
});
