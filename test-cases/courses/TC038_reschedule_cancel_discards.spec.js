// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, withDisposableSession, DSA } from './courses-helpers.js';

test('TC038 - Verify Reschedule Session Cancel leaves the session\'s date unchanged', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);

  await withDisposableSession(page, courses, async (card) => {
    await courses.cardMenuTrigger(card).click();
    await courses.menuItem('Reschedule Session').click();
    await courses.rescheduleDialog().locator('input').fill('01 January 2027, 09:00 AM');
    await courses.rescheduleCancelButton().click();

    await expect(courses.rescheduleDialog()).toBeHidden();
    await expect(card.getByText('NOW', { exact: true })).toBeVisible();
  });
});
