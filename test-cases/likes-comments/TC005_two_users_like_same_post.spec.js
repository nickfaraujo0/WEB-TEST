// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openAs, withQaPost, QaPost, STUDENT } from './likes-comments-helpers.js';

/**
 * Web-only (the app's TC010 — same reaction from several users increments the count). Confirmed
 * live: when the professor and a student both like a post, each of them sees "You and 1 other".
 */
test('TC005 - Verify two users liking one post shows "You and 1 other" to both', async ({ page, browser }) => {
  await loginAs(page);
  await withQaPost(page, 'TC005 two likes', async (post) => {
    await post.likeIcon.click();
    await expect(post.card.getByText('You', { exact: true })).toBeVisible();

    const student = await openAs(browser, STUDENT);
    try {
      const theirs = new QaPost(student.page, post.marker);
      await expect(theirs.card).toBeVisible({ timeout: 25000 });
      await theirs.likeIcon.click();
      await expect(theirs.card.getByText('You and 1 other', { exact: true })).toBeVisible();

      await post.reload();
      await expect(post.card.getByText('You and 1 other', { exact: true })).toBeVisible();
    } finally {
      await student.context.close();
    }
  });
});
