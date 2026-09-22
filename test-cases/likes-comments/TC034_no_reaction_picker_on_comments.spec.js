// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web-only. Confirmed live: as with the post-level heart (TC006), the "Like" label under a comment
 * opens no reaction picker on hover or on a long press — the press just applies the single like.
 */
test('TC034 - Verify hover and long-press open no picker on a comment Like', async ({ page }) => {
  test.setTimeout(120000);
  await loginAs(page);
  await withQaPost(page, 'TC034 comment picker', async (post) => {
    await post.openComments();
    await post.postComment('press me');
    const like = post.item('press me').getByText('Like', { exact: true });

    await like.hover();
    await page.waitForTimeout(1500);
    await expect(post.popups).toHaveCount(0);

    const box = await like.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1300);
    await expect(post.popups).toHaveCount(0);
    await page.mouse.up();

    await expect(post.item('press me').getByText('Love', { exact: true })).toBeVisible();
  });
});
