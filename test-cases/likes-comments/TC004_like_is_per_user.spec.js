// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openAs, withQaPost, QaPost, STUDENT } from './likes-comments-helpers.js';

/**
 * Web-only. Confirmed live: a like belongs to the user who made it. The professor's like shows
 * as "You" to the professor, but a student looking at the same post sees "1 other" and no "You".
 */
test('TC004 - Verify another account sees a like as "1 other", not "You"', async ({ page, browser }) => {
  await loginAs(page);
  await withQaPost(page, 'TC004 per-user like', async (post) => {
    await post.likeIcon.click();
    await expect(post.card.getByText('You', { exact: true })).toBeVisible();

    const student = await openAs(browser, STUDENT);
    try {
      const theirCard = new QaPost(student.page, post.marker).card;
      await expect(theirCard).toBeVisible({ timeout: 25000 });
      await expect(theirCard.getByText('1 other', { exact: true })).toBeVisible();
      await expect(theirCard.getByText('You', { exact: true })).toHaveCount(0);
    } finally {
      await student.context.close();
    }
  });
});
