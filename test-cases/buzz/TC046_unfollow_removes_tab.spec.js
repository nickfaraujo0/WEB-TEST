// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsStudent } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { followButton, openTpoBoard, ensureUnfollowed, withStudentFollowLock, FOLLOW_LOCK_TEST_TIMEOUT } from './board-follow.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC046 — If you unfollow a Board that board tab should
 * not be visible in Buzz.
 * Precondition: following a Board. Steps: 1. Find a Buzz with label. 2. Click the label.
 * 3. Click "Unfollow". 4. Go back to the default Buzz page. 5. Check the unfollowed Board tab
 * is not visible.
 * Expected result: not specified — inferred: the tab disappears.
 *
 * The precondition is created by the test itself (student follows TPO first) so it doesn't
 * depend on leftover state.
 */
test('TC046 - Verify unfollowing a board removes its tab from the Buzz page', async ({ page }) => {
  test.setTimeout(FOLLOW_LOCK_TEST_TIMEOUT);
  await withStudentFollowLock(async () => {
    await loginAsStudent(page);
    const buzz = new BuzzPage(page);

    await openTpoBoard(page);
    try {
      if ((await followButton(page).innerText()).trim() === 'Follow') await followButton(page).click();
      await expect(followButton(page)).toHaveText('Unfollow');
      await buzz.goto();
      await expect(buzz.boardTab('TPO')).toBeVisible({ timeout: 15000 });

      await openTpoBoard(page);
      await expect(followButton(page)).toHaveText('Unfollow');
      await followButton(page).click();
      await expect(followButton(page)).toHaveText('Follow');

      await buzz.goto();
      await expect(buzz.feedCards().first()).toBeVisible({ timeout: 15000 });
      await expect(buzz.boardTab('TPO')).toHaveCount(0);
    } finally {
      await openTpoBoard(page);
      await ensureUnfollowed(page);
    }
  });
});
