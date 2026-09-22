// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web-only. Real gap versus the app (likes sheet TC008-TC014, where tapping the count lists who
 * reacted): confirmed live that clicking the "You" summary on a liked post opens nothing, so
 * the web has no way to see who liked a post.
 */
test('TC007 - Verify clicking the like summary opens no list of who liked (gap)', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC007 no like list', async (post) => {
    await post.likeIcon.click();
    const summary = post.card.getByText('You', { exact: true });
    await expect(summary).toBeVisible();

    await summary.click();
    await page.waitForTimeout(1500);

    await expect(page.locator('[role="dialog"]:visible, .ant-modal:visible, .ant-drawer:visible')).toHaveCount(0);
  });
});
