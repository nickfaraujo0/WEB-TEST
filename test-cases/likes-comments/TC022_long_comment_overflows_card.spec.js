// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web-only. Real bug, confirmed live: a long unbroken comment (700 characters, no spaces) is not wrapped and runs past the edge of the post card. */
test('TC022 - Verify a long unbroken comment overflows the card (bug)', async ({ page }) => {
  test.setTimeout(120000);
  await loginAs(page);
  await withQaPost(page, 'TC022 long comment', async (post) => {
    await post.openComments();
    await post.commentBox.fill('L'.repeat(700) + ' end');
    await post.sendButton(post.commentBox).click();

    const bubble = post.card.locator('p', { hasText: /^L{50}/ }).first();
    await expect(bubble).toBeVisible();
    await post.waitSaved();

    const overflows = await post.card.evaluate((card, el) => card.getBoundingClientRect().right < el.getBoundingClientRect().right, await bubble.elementHandle());
    expect(overflows).toBe(true);
  });
});
