// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web-only. Confirmed live: the comment icon opens an inline section under the post with a "No comments yet" empty state and a "Leave a comment" box. */
test('TC009 - Verify the comment icon opens an inline comment section', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC009 open comments', async (post) => {
    await post.commentIcon.click();

    await expect(post.card.getByText('No comments yet')).toBeVisible();
    await expect(post.commentBox).toBeVisible();
  });
});
