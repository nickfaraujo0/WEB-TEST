// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web-only (the app's likes suite starts from a tap that adds the default reaction).
 * Confirmed live: clicking the heart turns it into a filled red heart and shows "You" above
 * the icons. Runs on a throwaway QA Buzz that is deleted afterwards.
 */
test('TC001 - Verify clicking the heart likes a post', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC001 like', async (post) => {
    await post.likeIcon.click();

    await expect(post.card.getByText('You', { exact: true })).toBeVisible();
    await expect(post.card.locator('.reactions > *').first().locator('img')).toBeVisible();
  });
});
