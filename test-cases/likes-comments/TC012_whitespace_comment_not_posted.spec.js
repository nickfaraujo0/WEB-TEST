// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web-only. Confirmed live: a comment made only of spaces is not posted either, again with no message; the spaces stay in the box. */
test('TC012 - Verify a whitespace-only comment is not posted', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC012 spaces comment', async (post) => {
    await post.openComments();
    await post.commentBox.fill('   ');

    await post.sendButton(post.commentBox).click();
    await page.waitForTimeout(1500);

    await expect(post.card.getByText('No comments yet')).toBeVisible();
    await expect(page.locator('.ant-message:visible, .ant-notification:visible, [role="alert"]:visible')).toHaveCount(0);
  });
});
