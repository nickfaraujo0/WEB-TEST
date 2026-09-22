// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web equivalent of the app's comments TC011/TC013. Confirmed live: clicking "View 2 Replies"
 * first shows only the newest reply plus a "See more replies" link; clicking that reveals the
 * remaining replies.
 */
test('TC031 - Verify "View N Replies" shows the newest reply and "See more replies" shows the rest', async ({ page }) => {
  test.setTimeout(180000);
  await loginAs(page);
  await withQaPost(page, 'TC031 expand replies', async (post) => {
    await post.openComments();
    await post.postComment('parent');
    await post.postReply('parent', 'reply one');
    await post.postReply('parent', 'reply two');
    await post.reload();
    await post.openComments();

    await post.card.getByText(/^View 2 Repl/).click();

    await expect(post.card.getByText('reply two', { exact: true })).toBeVisible();
    await expect(post.card.getByText('reply one', { exact: true })).toBeHidden();
    await post.card.getByText('See more replies').click();
    await expect(post.card.getByText('reply one', { exact: true })).toBeVisible();
  });
});
