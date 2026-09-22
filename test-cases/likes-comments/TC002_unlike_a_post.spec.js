// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web-only. Confirmed live: clicking a liked heart removes the like — the outline heart returns and "You" disappears. */
test('TC002 - Verify clicking a liked heart unlikes the post', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC002 unlike', async (post) => {
    await post.likeIcon.click();
    await expect(post.card.getByText('You', { exact: true })).toBeVisible();

    await post.likeIcon.click();

    await expect(post.card.getByText('You', { exact: true })).toHaveCount(0);
    await expect(post.card.locator('.reactions > *').first().locator('img')).toHaveCount(0);
  });
});
