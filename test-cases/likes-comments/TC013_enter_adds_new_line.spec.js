// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web-only. Confirmed live: pressing Enter in the comment box adds a new line instead of sending — only the green arrow sends. */
test('TC013 - Verify Enter adds a new line instead of sending the comment', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC013 enter key', async (post) => {
    await post.openComments();
    await post.commentBox.fill('first');

    await post.commentBox.press('Enter');
    await page.waitForTimeout(2000);

    await expect(post.commentBox).toHaveValue('first\n');
    await expect(post.card.getByText('No comments yet')).toBeVisible();
  });
});
