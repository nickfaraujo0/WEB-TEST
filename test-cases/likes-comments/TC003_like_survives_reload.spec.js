// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web-only. A like is saved on the server: after a reload the post is still shown as liked by "You". */
test('TC003 - Verify a like survives a reload', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC003 like reload', async (post) => {
    await post.likeIcon.click();
    await expect(post.card.getByText('You', { exact: true })).toBeVisible();

    await post.reload();

    await expect(post.card.getByText('You', { exact: true })).toBeVisible();
  });
});
