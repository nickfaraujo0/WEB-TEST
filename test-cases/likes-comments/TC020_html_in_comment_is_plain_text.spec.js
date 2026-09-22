// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web-only security check, confirmed live: HTML typed into a comment is shown as literal text and never becomes real markup or runs. */
test('TC020 - Verify HTML in a comment is shown as plain text', async ({ page }) => {
  test.setTimeout(120000);
  await loginAs(page);
  await withQaPost(page, 'TC020 html comment', async (post) => {
    await post.openComments();
    const text = '<b>bold</b> <script>alert(1)</script>';
    await post.commentBox.fill(text);
    await post.sendButton(post.commentBox).click();
    await post.waitSaved();

    await expect(post.card.getByText(text)).toBeVisible();
    await expect(post.card.locator('b, script')).toHaveCount(0);
  });
});
