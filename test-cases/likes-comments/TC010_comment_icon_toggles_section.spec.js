// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web-only. Clicking the comment icon a second time closes the inline comment section again. */
test('TC010 - Verify clicking the comment icon again closes the section', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC010 toggle comments', async (post) => {
    await post.commentIcon.click();
    await expect(post.commentBox).toBeVisible();

    await post.commentIcon.click();

    await expect(post.commentBox).not.toBeVisible();
  });
});
