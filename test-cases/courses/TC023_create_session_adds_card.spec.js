// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, withDisposableSession, DSA } from './courses-helpers.js';

/** Confirmed live: a session created for right now is tagged "NOW" on its card and defaults
 * to Lecture / All Participants / the creating faculty. */
test('TC023 - Verify creating a session with default values adds a new "NOW" card', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);

  await withDisposableSession(page, courses, async (card) => {
    await expect(card.getByText('All Participants', { exact: true })).toBeVisible();
    await expect(card.getByText('Lecture', { exact: false })).toBeVisible();
    await expect(card.getByText('Nolan Dmello', { exact: false })).toBeVisible();
  });
});
