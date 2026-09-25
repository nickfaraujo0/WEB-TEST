// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';

/**
 * TC052 — Verify a shared Buzz link does not open the post on web (gap). Web-only; not in the sheet.
 * Confirmed live (2026-09-25): the link from Share -> Copy Link
 * (/app/page_view_announcements?id=<postId>) opened in the browser — even signed in — shows a
 * "Get a better experience with our app" landing page, not the shared post. So a Buzz shared from
 * the web cannot be viewed on the web. Asserts that gap; fails (prompting an update) once the link
 * opens the post. Chromium only: the link can only be read from the clipboard there.
 */
test('TC052 - Verify a shared Buzz link does not open the post on web (gap)', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Reading the copied link needs clipboard-read, which only Chromium grants.');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  await expect(buzz.feedCards().first()).toBeVisible({ timeout: 15000 });
  const postText = (await buzz.feedCards().first().locator('.ql-editor').first().innerText()).trim().split('\n')[0];

  await buzz.shareIcon(0).click();
  await buzz.shareDialog().getByText('Copy Link').click();
  await expect(page.getByText('Link copied to clipboard!')).toBeVisible();
  const link = (await page.evaluate(() => navigator.clipboard.readText())).match(/https?:\/\/\S+page_view_announcements\?id=[\w-]+/)?.[0];
  expect(link, 'copied text contains a post link').toBeTruthy();

  await page.goto(/** @type {string} */ (link), { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Get a better experience with our app')).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(postText.slice(0, 40))).toHaveCount(0);
});
