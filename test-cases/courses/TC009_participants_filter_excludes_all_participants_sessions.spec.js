// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/**
 * Confirmed live: filtering Participants by a single batch (B1) is a literal match against
 * the session's own participants list — an "All Participants" session does NOT also match,
 * even though "All" logically includes B1. This is surprising behavior worth locking down.
 */
test('TC009 - Verify filtering Participants by one batch excludes "All Participants" sessions', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  const allParticipantsCard = courses.cardByText('All Participants').first();
  await expect(allParticipantsCard).toBeVisible();

  await courses.openParticipantsMenu();
  await courses.toggleParticipant('B1');
  await page.keyboard.press('Escape');

  await expect(allParticipantsCard).toBeHidden();
});
