// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web-only. Confirmed live: a saved comment shows the author's full name, their department and
 * a relative time such as "9s" or "2min". Values are the first professor account's (Nolan
 * Dmello, Chemical Engineering).
 */
test('TC015 - Verify a comment shows the author, department and relative time', async ({ page }) => {
  test.setTimeout(120000);
  await loginAs(page);
  await withQaPost(page, 'TC015 comment details', async (post) => {
    await post.openComments();
    await post.postComment('details check');
    await post.reload();
    await post.openComments();

    const item = post.item('details check');
    await expect(item.getByText('Nolan Dmello', { exact: true })).toBeVisible();
    await expect(item.getByText('Chemical Engineering', { exact: true })).toBeVisible();
    await expect(item.getByText(/^\d+\s?(s|min|h|d)$/)).toBeVisible();
  });
});
