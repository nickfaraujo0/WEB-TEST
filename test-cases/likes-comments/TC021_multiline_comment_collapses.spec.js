// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web-only. Real bug, confirmed live: a comment typed on two lines (Shift+Enter) is shown on
 * one line — the bubble uses `white-space: normal`, so the line break is lost.
 */
test('TC021 - Verify a multi-line comment loses its line break (bug)', async ({ page }) => {
  test.setTimeout(120000);
  await loginAs(page);
  await withQaPost(page, 'TC021 multiline', async (post) => {
    await post.openComments();
    await post.commentBox.click();
    await post.commentBox.pressSequentially('line one');
    await post.commentBox.press('Shift+Enter');
    await post.commentBox.pressSequentially('line two');
    await post.sendButton(post.commentBox).click();

    const bubble = post.card.locator('p', { hasText: 'line one' }).first();
    await expect(bubble).toBeVisible();
    await post.waitSaved();

    expect(await bubble.evaluate((e) => getComputedStyle(e).whiteSpace)).toBe('normal');
    expect(await bubble.innerText()).toBe('line one line two');
  });
});
