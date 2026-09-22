// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openAs, withQaPost, QaPost, STUDENT } from './likes-comments-helpers.js';

/** Web-only. Confirmed live: a comment posted by the professor is visible to a student who opens the same post. */
test('TC018 - Verify another account sees a posted comment', async ({ page, browser }) => {
  test.setTimeout(150000);
  await loginAs(page);
  await withQaPost(page, 'TC018 shared comment', async (post) => {
    await post.openComments();
    await post.postComment('seen by others');

    const student = await openAs(browser, STUDENT);
    try {
      const theirs = new QaPost(student.page, post.marker);
      await expect(theirs.card).toBeVisible({ timeout: 25000 });
      await theirs.commentIcon.click();

      await expect(theirs.card.getByText('seen by others', { exact: true })).toBeVisible();
    } finally {
      await student.context.close();
    }
  });
});
