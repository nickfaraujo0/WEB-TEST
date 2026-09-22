// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web equivalent of the app's comments TC001/TC002. Confirmed live: clicking send with an empty
 * box posts nothing and shows no error message — it silently does nothing.
 */
test('TC011 - Verify an empty comment is not posted', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC011 empty comment', async (post) => {
    await post.openComments();

    await post.sendButton(post.commentBox).click();
    await page.waitForTimeout(1500);

    await expect(post.card.getByText('No comments yet')).toBeVisible();
    await expect(page.locator('.ant-message:visible, .ant-notification:visible, [role="alert"]:visible')).toHaveCount(0);
  });
});
