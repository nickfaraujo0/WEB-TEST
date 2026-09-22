// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web-only. Confirmed live: the post shows an "N comments" label next to the icons ("1 comment"
 * for one). After a reload it counts every saved comment and reply.
 */
test('TC017 - Verify the post shows a comment count', async ({ page }) => {
  test.setTimeout(150000);
  await loginAs(page);
  await withQaPost(page, 'TC017 comment count', async (post) => {
    await post.openComments();
    await post.postComment('count one');
    await expect(post.countLabel).toHaveText('1 comment');

    await post.postComment('count two');
    await post.reload();

    await expect(post.countLabel).toHaveText('2 comments');
  });
});
