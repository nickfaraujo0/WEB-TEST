// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { followButton, openTpoBoard, ensureUnfollowed, withStudentFollowLock, FOLLOW_LOCK_TEST_TIMEOUT } from './board-follow.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC045 — Verify that following a Board creates a new tab
 * in Buzz.
 * Steps: 1. Find a Buzz with label. 2. Click the label. 3. Click "Follow". 4. Go back to the
 * default Buzz page. 5. Check the new followed Board tab is visible.
 * Expected result: not specified — inferred: a tab named after the board appears next to "All".
 *
 * Runs as the student (follows nothing by default; before following, the student sees no tab
 * strip at all). Always unfollows at the end.
 */
test('TC045 - Verify following a board adds a tab for it on the Buzz page', async ({ page }) => {
  test.setTimeout(FOLLOW_LOCK_TEST_TIMEOUT);
  await withStudentFollowLock(async () => {
    await loginAsStudent(page);
    const buzz = new BuzzPage(page);
    await expect(buzz.boardTab('TPO')).toHaveCount(0);

    await openTpoBoard(page);
    await ensureUnfollowed(page);
    try {
      await followButton(page).click();
      await expect(followButton(page)).toHaveText('Unfollow');

      await buzz.goto();
      await expect(buzz.boardTab('TPO')).toBeVisible({ timeout: 15000 });
      await expect(buzz.boardTab('All')).toBeVisible();
    } finally {
      await openTpoBoard(page);
      await ensureUnfollowed(page);
    }
  });
});
