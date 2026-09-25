// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage, waitForStableCount } from './buzz-feed-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC048 — Verify that switching tab to a specific Board
 * only shows Buzz from that Board.
 * Steps: 1. Find a Buzz with label. 2. Click the label. 3. Check only that board's Buzz are
 * visible.
 * Expected result: not specified — inferred: on a board's tab (and on its board page) every
 * post carries that board's label.
 *
 * Checked on every board tab and on the /Buzz/Board/<id> page reached by clicking a label.
 */
test('TC048 - Verify each board tab shows only Buzzes from that board', async ({ page }) => {
  test.setTimeout(120000);
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  await expect(buzz.boardTab('All')).toBeVisible({ timeout: 15000 });
  const boards = (await page.getByRole('tab').allInnerTexts()).map((n) => n.trim()).filter((n) => n !== 'All');

  for (const board of boards) {
    await buzz.boardTab(board).click();
    await expect(buzz.boardTab(board)).toHaveAttribute('aria-selected', 'true');
    await expect(buzz.feedCards().first()).toBeVisible({ timeout: 15000 });
    // The previous tab's cards are replaced in place — wait until only this board's labels remain.
    await expect
      .poll(async () => [...new Set((await buzz.boardLabels().allInnerTexts()).map((l) => l.trim()))], { timeout: 15000 })
      .toEqual([board]);

    const labels = await buzz.boardLabels().allInnerTexts();
    expect(labels.length, `${board} tab shows posts`).toBeGreaterThan(0);
    expect([...new Set(labels.map((l) => l.trim()))], `${board} tab labels`).toEqual([board]);
  }

  await buzz.boardTab('All').click();
  await buzz.loadUntilPresent(buzz.boardLabels());
  await buzz.boardLabels().first().scrollIntoViewIfNeeded();
  await buzz.boardLabels().first().click();
  await expect(page).toHaveURL(/\/Buzz\/Board\//);
  await expect(buzz.feedCards().first()).toBeVisible({ timeout: 15000 });
  await waitForStableCount(buzz.feedCards());
  const boardPageLabels = [...new Set((await buzz.boardLabels().allInnerTexts()).map((l) => l.trim()))];
  expect(boardPageLabels).toHaveLength(1);
});
