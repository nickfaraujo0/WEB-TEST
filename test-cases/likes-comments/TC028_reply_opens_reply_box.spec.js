// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web equivalent of the app's comments TC004. Confirmed live: clicking "Reply" under a comment opens a "Reply to comment" box beneath it. */
test('TC028 - Verify Reply opens a reply box under the comment', async ({ page }) => {
  test.setTimeout(120000);
  await loginAs(page);
  await withQaPost(page, 'TC028 reply box', async (post) => {
    await post.openComments();
    await post.postComment('reply to me');

    await post.item('reply to me').getByText('Reply', { exact: true }).first().click();

    await expect(post.replyBox).toBeVisible();
  });
});
