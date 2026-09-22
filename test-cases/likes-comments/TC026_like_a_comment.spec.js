// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web equivalent of the app's comments TC006. Confirmed live: clicking "Like" under a comment
 * turns the label into a green "Love" with a red heart and shows "You" on the right.
 */
test('TC026 - Verify liking a comment shows "Love" and "You"', async ({ page }) => {
  test.setTimeout(120000);
  await loginAs(page);
  await withQaPost(page, 'TC026 like comment', async (post) => {
    await post.openComments();
    await post.postComment('like me');
    const item = post.item('like me');

    await item.getByText('Like', { exact: true }).click();

    await expect(item.getByText('Love', { exact: true })).toBeVisible();
    await expect(item.getByText('You', { exact: true })).toBeVisible();
  });
});
