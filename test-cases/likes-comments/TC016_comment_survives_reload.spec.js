// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web-only. A saved comment is still there after a reload of the feed. */
test('TC016 - Verify a comment survives a reload', async ({ page }) => {
  test.setTimeout(120000);
  await loginAs(page);
  await withQaPost(page, 'TC016 comment reload', async (post) => {
    await post.openComments();
    await post.postComment('still here');

    await post.reload();
    await post.openComments();

    await expect(post.card.getByText('still here', { exact: true })).toBeVisible();
  });
});
