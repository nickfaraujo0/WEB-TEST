// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, withDisposableSession, DSA } from './courses-helpers.js';

/** Confirmed live: rescheduling a session to a different day moves its card to that new
 * date/time and re-sorts the list — verified by rescheduling a fresh disposable session. */
test('TC037 - Verify Reschedule Session Save moves the session to the new date', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);

  await withDisposableSession(page, courses, async (card) => {
    await courses.cardMenuTrigger(card).click();
    await courses.menuItem('Reschedule Session').click();
    await courses.rescheduleDateTimeInput().click();

    const dialog = courses.rescheduleDialog();
    await dialog.getByText('25', { exact: true }).click();
    await dialog.getByRole('button', { name: 'OK' }).click();
    await courses.rescheduleSaveButton().click();

    await expect(courses.rescheduleDialog()).toBeHidden({ timeout: 15000 });
    await expect(page.getByText('25 Sep', { exact: false })).toBeVisible({ timeout: 15000 });
  });
});
