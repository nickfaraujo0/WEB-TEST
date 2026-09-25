// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage, waitForStableCount } from './buzz-feed-page.js';
import { TPO_BOARD_URL } from './board-follow.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC049 — Check if Pagination is working properly when
 * you are inside the Board.
 * Steps: 1. Find a Buzz with label. 2. Click the label. 3. Scroll the Buzz in that Board.
 * 4. Check pagination is working.
 * Expected result: not specified — inferred: scrolling to the bottom loads further pages,
 * without mixing in other boards' posts.
 *
 * Confirmed live: the feed is infinite-scroll with a page size of 11. On the Event Board tab
 * scrolling took the card count from 11 to 33; TPO (only ~12 posts) went 11 -> 12 then stopped.
 * The exact counts move as posts are added, so assertions only require growth and consistency.
 */
test('TC049a - Event Board tab loads more posts on scroll, all from that board', async ({ page }) => {
  test.setTimeout(120000);
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  await buzz.boardTab('Event Board').click();
  await expect(buzz.feedCards().first()).toBeVisible({ timeout: 15000 });
  await waitForStableCount(buzz.feedCards());

  const before = await buzz.feedCards().count();
  await buzz.scrollFeedToBottom(4);
  const after = await buzz.feedCards().count();

  expect(after).toBeGreaterThan(before);
  expect([...new Set((await buzz.boardLabels().allInnerTexts()).map((l) => l.trim()))]).toEqual(['Event Board']);
});

test('TC049b - Board page (opened via a label) paginates and stays on that board', async ({ page }) => {
  test.setTimeout(120000);
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  await page.goto(TPO_BOARD_URL, { waitUntil: 'domcontentloaded' });
  await expect(buzz.feedCards().first()).toBeVisible({ timeout: 15000 });
  await waitForStableCount(buzz.feedCards());

  const before = await buzz.feedCards().count();
  await buzz.scrollFeedToBottom(4);
  const after = await buzz.feedCards().count();

  expect(after).toBeGreaterThanOrEqual(before);
  expect(after).toBeGreaterThan(11);
  expect([...new Set((await buzz.boardLabels().allInnerTexts()).map((l) => l.trim()))]).toEqual(['TPO']);
});
