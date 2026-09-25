// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC002 — Verify Buzz list is scrollable.
 * Precondition: logged in; the shared dev feed already carries dozens of posts from earlier
 * runs, more than fit in one viewport.
 * Steps: Scroll down the Buzz feed.
 * Expected: later posts, not visible on load, scroll into view.
 */
test('TC002 - Verify Buzz list is scrollable', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await expect(buzzPage.cards.first()).toBeVisible();
  expect(await buzzPage.cards.count()).toBeGreaterThan(1);

  // Pin the card that is last on first load by index: infinite scroll appends more cards as the
  // feed scrolls, so `.last()` would re-resolve to a newer card still below the fold.
  const initialLast = buzzPage.cards.nth((await buzzPage.cards.count()) - 1);
  await expect(initialLast).not.toBeInViewport();

  await buzzPage.cards.first().hover();
  // Keep wheeling until the pinned card scrolls into view (web-first retry, no fixed sleep).
  await expect(async () => {
    await page.mouse.wheel(0, 1500);
    await expect(initialLast).toBeInViewport({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
});
