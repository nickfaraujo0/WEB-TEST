// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC003 — Verify Buzz cards are separated (not merged
 * into one continuous block).
 * Precondition: logged in, at least 2 posts in the feed.
 * Steps: Observe the feed.
 * Expected: each post renders as its own visually distinct card.
 */
test('TC003 - Verify Buzz cards are visually separated', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const buzzPage = new BuzzPage(page);
  await expect(buzzPage.cards.nth(1)).toBeVisible();

  const first = await buzzPage.cards.nth(0).boundingBox();
  const second = await buzzPage.cards.nth(1).boundingBox();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();

  // Distinct cards: the second starts at or below where the first ends, never overlapping it.
  expect(second.y).toBeGreaterThanOrEqual(first.y + first.height - 1);
});
