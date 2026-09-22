// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web-only. Real bug, confirmed live: after posting replies the post's count label stays at
 * "1 comment"; only a reload brings it up to the real total.
 */
test('TC025 - Verify the comment count does not update after replies (bug)', async ({ page }) => {
  test.setTimeout(180000);
  await loginAs(page);
  await withQaPost(page, 'TC025 stale count', async (post) => {
    await post.openComments();
    await post.postComment('parent');
    await expect(post.countLabel).toHaveText('1 comment');

    await post.postReply('parent', 'reply a');
    await post.postReply('parent', 'reply b');
    await expect(post.countLabel).toHaveText('1 comment');

    await post.reload();
    await expect(post.countLabel).toHaveText('3 comments');
  });
});
