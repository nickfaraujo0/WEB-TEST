// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';

/**
 * TC051 — Verify "Copy Link" copies the Buzz with a Hive link. Web-only; not in Hive Test Cases.xlsx.
 * Confirmed live (2026-09-25): Share -> "Copy Link" shows the toast "Link copied to clipboard!" and
 * copies "<post text> ...see more on your Hive: <origin>/app/page_view_announcements?id=<postId>".
 * The toast is checked on every browser; the clipboard text only on Chromium, the one engine where
 * Playwright can grant clipboard-read.
 */
test('TC051 - Verify Copy Link copies the Buzz text with a Hive link', async ({ page, context, browserName }) => {
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  await expect(buzz.feedCards().first()).toBeVisible({ timeout: 15000 });
  const firstText = (await buzz.feedCards().first().locator('.ql-editor').first().innerText()).trim();

  await buzz.shareIcon(0).click();
  await buzz.shareDialog().getByText('Copy Link').click();
  await expect(page.getByText('Link copied to clipboard!')).toBeVisible();

  if (browserName === 'chromium') {
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(firstText.split('\n')[0].slice(0, 30));
    expect(copied).toMatch(/\/app\/page_view_announcements\?id=[\w-]+/);
  }
});
