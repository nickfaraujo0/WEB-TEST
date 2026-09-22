// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web equivalent of the app's comments TC005. A user can reply to their own comment; after a reload the reply is tucked under "View 1 Reply" and the post counts both. */
test('TC033 - Verify replying to your own comment works', async ({ page }) => {
  test.setTimeout(150000);
  await loginAs(page);
  await withQaPost(page, 'TC033 own reply', async (post) => {
    await post.openComments();
    await post.postComment('my comment');
    await post.postReply('my comment', 'my reply');

    await post.reload();
    await post.openComments();

    await expect(post.countLabel).toHaveText('2 comments');
    await post.card.getByText(/^View 1 Repl/).click();
    await expect(post.card.getByText('my reply', { exact: true })).toBeVisible();
  });
});
