// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web-only. Confirmed live that the smiley beside the comment box opens a categorized emoji
 * picker (Smileys & People, Animals & Nature, ...) built with EmojiPickerReact, whose emoji
 * buttons are `button.epr-emoji`. The test clicks the first emoji shown and expects it to land
 * in the box.
 */
test('TC019 - Verify the emoji button opens a picker and inserts an emoji', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC019 emoji', async (post) => {
    await post.openComments();

    await post.emojiButton(post.commentBox).click();

    await expect(page.getByText('Smileys & People').first()).toBeVisible();
    await page.locator('button.epr-emoji:visible').first().click();
    await expect(post.commentBox).not.toHaveValue('');
  });
});
