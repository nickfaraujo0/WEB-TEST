// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web equivalent of the app's comments TC003 (comment appears instantly). Confirmed live: the
 * comment shows in the list straight away, dimmed while the `createComment` cloud function
 * runs (several seconds), then gains its Like and Reply controls once it is saved.
 */
test('TC014 - Verify a posted comment appears at once and is then saved', async ({ page }) => {
  test.setTimeout(120000);
  await loginAs(page);
  await withQaPost(page, 'TC014 post comment', async (post) => {
    await post.openComments();
    await post.commentBox.fill('hello comment');

    await post.sendButton(post.commentBox).click();

    await expect(post.card.getByText('hello comment', { exact: true })).toBeVisible({ timeout: 5000 });
    await post.waitSaved();
    const item = post.item('hello comment');
    await expect(item.getByText('Like', { exact: true })).toBeVisible();
    await expect(item.getByText('Reply', { exact: true })).toBeVisible();
    await expect(post.commentBox).toHaveValue('');
  });
});
