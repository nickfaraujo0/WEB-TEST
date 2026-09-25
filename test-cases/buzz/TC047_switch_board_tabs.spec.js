// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC047 — User should be able to switch between the Board
 * tabs.
 * Steps: 1. Check for the followed tabs. 2. Click on different tabs. 3. Check it's working
 * properly.
 * Expected result: not specified — inferred: each click selects that tab (and only that tab),
 * including going back to "All".
 *
 * Uses the professor account, which follows all six boards. Confirmed live: tab switching does
 * not change the URL (stays /Buzz) — the feed just re-filters in place.
 */
test('TC047 - Verify the user can switch between the followed board tabs', async ({ page }) => {
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  await expect(buzz.boardTab('All')).toBeVisible({ timeout: 15000 });

  const names = (await page.getByRole('tab').allInnerTexts()).map((n) => n.trim());
  expect(names[0]).toBe('All');
  expect(names.length).toBeGreaterThan(2);

  for (const name of [...names.slice(1), 'All']) {
    await buzz.boardTab(name).click();
    await expect(buzz.boardTab(name)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { selected: true })).toHaveCount(1);
    await expect(page).toHaveURL(/\/Buzz\/?$/i);
  }
});
