// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web-only. The app opens a five-reaction picker on long-press (likes sheet TC003-TC006);
 * confirmed live that the web has no such picker: hovering the heart, or holding the mouse
 * button down on it for over a second, opens no popover — there is a single like reaction.
 */
test('TC006 - Verify hover and long-press open no reaction picker on a post', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC006 no picker', async (post) => {
    await post.likeIcon.hover();
    await page.waitForTimeout(1500);
    await expect(post.popups).toHaveCount(0);

    const box = await post.likeIcon.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1300);
    await expect(post.popups).toHaveCount(0);
    await page.mouse.up();
  });
});
