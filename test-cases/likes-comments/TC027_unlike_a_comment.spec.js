// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web equivalent of the app's comments TC007. Confirmed live: clicking "Love" on a liked comment removes the like — the label goes back to "Like" and "You" disappears. */
test('TC027 - Verify clicking "Love" unlikes a comment', async ({ page }) => {
  test.setTimeout(120000);
  await loginAs(page);
  await withQaPost(page, 'TC027 unlike comment', async (post) => {
    await post.openComments();
    await post.postComment('unlike me');
    const item = post.item('unlike me');
    await item.getByText('Like', { exact: true }).click();
    await expect(item.getByText('Love', { exact: true })).toBeVisible();

    await item.getByText('Love', { exact: true }).click();

    await expect(item.getByText('Like', { exact: true })).toBeVisible();
    await expect(item.getByText('You', { exact: true })).toHaveCount(0);
  });
});
