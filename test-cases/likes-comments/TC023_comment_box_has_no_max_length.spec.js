// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/** Web-only. Confirmed live: the comment box has no maximum length — a 700-character comment is accepted as typed. Nothing is posted. */
test('TC023 - Verify the comment box has no maximum length (bug)', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC023 max length', async (post) => {
    await post.openComments();

    await post.commentBox.fill('x'.repeat(700));

    expect(await post.commentBox.evaluate((e) => /** @type {HTMLTextAreaElement} */ (e).maxLength)).toBe(-1);
    expect((await post.commentBox.inputValue()).length).toBe(700);
  });
});
