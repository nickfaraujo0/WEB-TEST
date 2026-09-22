// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web-only. Real bug, confirmed live: a comment shows the author as "Nolan" (first name only)
 * right after it is posted, but as "Nolan Dmello" once the page is reloaded.
 */
test('TC024 - Verify the comment author name changes after a reload (bug)', async ({ page }) => {
  test.setTimeout(120000);
  await loginAs(page);
  await withQaPost(page, 'TC024 author name', async (post) => {
    await post.openComments();
    await post.postComment('name check');
    await expect(post.item('name check').getByText('Nolan', { exact: true })).toBeVisible();

    await post.reload();
    await post.openComments();

    await expect(post.item('name check').getByText('Nolan Dmello', { exact: true })).toBeVisible();
  });
});
