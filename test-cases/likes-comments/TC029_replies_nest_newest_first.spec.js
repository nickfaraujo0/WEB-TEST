// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web-only. Confirmed live: replies sit inside their parent comment, newest first, and a reply
 * offers only "Like" — there is no Reply button on a reply.
 */
test('TC029 - Verify replies nest under the comment, newest first, with no Reply button', async ({ page }) => {
  test.setTimeout(180000);
  await loginAs(page);
  await withQaPost(page, 'TC029 nested replies', async (post) => {
    await post.openComments();
    await post.postComment('parent');
    await post.postReply('parent', 'reply one');
    await post.postReply('parent', 'reply two');
    await post.reload();
    await post.openComments();
    await post.card.getByText(/^View 2 Repl/).click();
    await post.card.getByText('See more replies').click();
    await expect(post.card.getByText('reply one', { exact: true })).toBeVisible();

    const text = await post.card.innerText();
    expect(text.indexOf('reply two')).toBeGreaterThan(-1);
    expect(text.indexOf('reply two')).toBeLessThan(text.indexOf('reply one'));
    await expect(post.item('reply two').getByText('Reply', { exact: true })).toHaveCount(0);
    await expect(post.item('reply two').getByText('Like', { exact: true })).toBeVisible();
  });
});
