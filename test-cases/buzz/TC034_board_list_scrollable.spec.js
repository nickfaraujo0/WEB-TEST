// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC034 — The list of "Boards" should be scrollable on
 * "Select Board" page.
 * Expected result: not specified — inferred: the board list has its own scroll region that
 * moves when scrolled.
 *
 * Confirmed live: the list is an overflow-y-auto region capped at 40vh (scrollHeight ~694 vs
 * clientHeight ~300 with 6 boards), so the last board is off-screen until scrolled.
 */
test('TC034 - Verify the board list scrolls inside the Choose Buzz Board step', async ({ page }) => {
  await loginAsProfessor(page);
  await new BuzzPage(page).createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText('TC034 board-scroll probe');
  await create.goToRecipients();
  await create.nextButton.click();
  await expect(create.boardCards.first()).toBeVisible();

  const scroller = create.boardListScroller;
  const dims = await scroller.evaluate((el) => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));
  expect(dims.scrollHeight).toBeGreaterThan(dims.clientHeight);

  await scroller.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  expect(await scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await expect(create.boardCards.last()).toBeInViewport();
});
