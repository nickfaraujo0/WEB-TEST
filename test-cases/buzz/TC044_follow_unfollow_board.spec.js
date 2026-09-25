// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from './session.js';
import { followButton, openTpoBoard, ensureUnfollowed, withStudentFollowLock, FOLLOW_LOCK_TEST_TIMEOUT } from './board-follow.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC044 — User should be able to follow/unfollow a
 * "Board".
 * Steps: 1. Find a Buzz with label. 2. Click the label. 3. Check you're on the Board page.
 * 4. Check a Follow/Unfollow button is at the top right. 5. Click it.
 * Expected result: not specified — inferred: the button flips Follow <-> Unfollow.
 *
 * Runs as the student account, which follows no boards by default (the professor account
 * already follows all six, so it can't show a Follow state). The test always ends by
 * unfollowing so the account is left as it started.
 */
test('TC044 - Verify a board can be followed and unfollowed from its page', async ({ page }) => {
  test.setTimeout(FOLLOW_LOCK_TEST_TIMEOUT);
  await withStudentFollowLock(async () => {
    await loginAsStudent(page);
    await openTpoBoard(page);
    await ensureUnfollowed(page);

    const btn = followButton(page);
    try {
      await expect(btn).toHaveText('Follow');
      await btn.click();
      await expect(btn).toHaveText('Unfollow');
      await btn.click();
      await expect(btn).toHaveText('Follow');
    } finally {
      await ensureUnfollowed(page);
    }
  });
});
