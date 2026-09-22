// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web equivalent of the app's comments TC008/TC009. A reply can be liked ("Love" and "You") and unliked the same way as a comment. */
test('TC032 - Verify a reply can be liked and unliked', async ({ page }) => {
  test.setTimeout(180000);
  await loginAs(page);
  await withQaPost(page, 'TC032 like reply', async (post) => {
    await post.openComments();
    await post.postComment('parent');
    await post.postReply('parent', 'reply one');
    await post.reload();
    await post.openComments();
    await post.card.getByText(/^View 1 Repl/).click();
    const reply = post.item('reply one');

    await reply.getByText('Like', { exact: true }).click();
    await expect(reply.getByText('Love', { exact: true })).toBeVisible();
    await expect(reply.getByText('You', { exact: true })).toBeVisible();

    await reply.getByText('Love', { exact: true }).click();
    await expect(reply.getByText('Like', { exact: true })).toBeVisible();
    await expect(reply.getByText('You', { exact: true })).toHaveCount(0);
  });
});
