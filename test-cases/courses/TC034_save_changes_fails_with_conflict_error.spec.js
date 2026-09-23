// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, withDisposableSession, DSA } from './courses-helpers.js';

/**
 * Confirmed live, reproduced twice with different field combinations: clicking "Save Changes"
 * on an existing session's Edit Session form fails every time with a "Buzzt! Failed to update
 * session details. Please try again." dialog. DevTools showed the real cause: the backend
 * call returns HTTP 409 ("Error saving lecture log"), a genuine conflict/backend bug, not a
 * client-side validation gap — selecting a Unit/Course Outcome/all Participants first (in
 * case an empty Participants list was the trigger) still failed identically.
 *
 * Runs against a disposable session created via `withDisposableSession`, not a real pre-
 * existing one: since Edit Session never prefills Participants/Unit (TC027-030), an
 * unexpected Save *success* here would silently persist a blanked-out participants/unit list
 * onto whatever session it targeted. Using a throwaway session (deleted in cleanup either way)
 * means that risk has no real data to land on, regardless of which way this bug goes.
 *
 * A real run showed the "Buzzt!" dialog must be dismissed before navigating away — it stayed
 * mounted over the Schedule page after `page.goBack()`, which then blocked
 * `withDisposableSession`'s own cleanup click on the card's "..." menu (obscured by the
 * leftover dialog) and left an orphaned session behind.
 */
test('TC034 - Verify Save Changes on Edit Session fails with a "Buzzt!" conflict error (bug)', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);

  await withDisposableSession(page, courses, async (card) => {
    await courses.cardMenuTrigger(card).click();
    await courses.menuItem('Edit Session').click();
    await expect(courses.sessionDetailsHeading()).toBeVisible({ timeout: 15000 });

    await courses.saveChangesButton().click();

    await expect(courses.buzztErrorDialog()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Failed to update session details', { exact: false })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(courses.buzztErrorDialog()).toBeHidden({ timeout: 10000 });

    await page.goBack();
    await expect(card).toBeVisible({ timeout: 15000 });
  });
});
