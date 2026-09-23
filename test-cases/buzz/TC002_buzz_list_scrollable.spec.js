// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC002 — Verify Buzz list is scrollable.
 * Precondition: logged in; the shared dev feed already carries dozens of posts from earlier
 * runs, more than fit in one viewport.
 * Steps: Scroll down the Buzz feed.
 * Expected: later posts, not visible on load, scroll into view.
 */
test('TC002 - Verify Buzz list is scrollable', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const buzzPage = new BuzzPage(page);
  await expect(buzzPage.cards.first()).toBeVisible();
  expect(await buzzPage.cards.count()).toBeGreaterThan(1);

  const lastCard = buzzPage.cards.last();
  await expect(lastCard).not.toBeInViewort();

  await buzzPage.cards.first().hover();
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(500);

  await expect(lastCard).toBeInViewport();
});
