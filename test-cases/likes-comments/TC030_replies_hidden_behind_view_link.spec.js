// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web equivalent of the app's comments TC011/TC012. Difference confirmed live: after a reload
 * the app shows the first reply and a "View more replies" link, while the web hides every
 * reply behind a "View N Replies" toggle under the parent until it is clicked (see TC031).
 */
test('TC030 - Verify replies are hidden behind a "View N Replies" toggle', async ({ page }) => {
  test.setTimeout(180000);
  await loginAs(page);
  await withQaPost(page, 'TC030 collapsed replies', async (post) => {
    await post.openComments();
    await post.postComment('parent');
    await post.postReply('parent', 'reply one');
    await post.postReply('parent', 'reply two');
    await post.reload();
    await post.openComments();

    await expect(post.card.getByText(/^View 2 Repl/)).toBeVisible();
    await expect(post.card.getByText('reply one', { exact: true })).toBeHidden();
    await expect(post.card.getByText('reply two', { exact: true })).toBeHidden();
  });
});
