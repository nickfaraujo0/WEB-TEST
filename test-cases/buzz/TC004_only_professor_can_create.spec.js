// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC004 — Verify only a Professor can create a Buzz.
 * Precondition: logged in as a Professor.
 * Steps: 1. Tap "Create Buzz". 2. Type a message. 3. Step through Recipients/Board. 4. Publish.
 * Expected: the Professor can complete the flow and the post appears in the feed.
 *
 * Publishes a real marker post to the shared dev feed, same as the mobile suite (see
 * tests/appium/Hive/Buzz/summary.md, "Test data this suite leaves behind"). Confirmed live:
 * publishing closes the wizard itself and the post lands at the top of the feed immediately.
 */
test('TC004 - Verify only a Professor can create a Buzz', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const buzzPage = new BuzzPage(page);
  await expect(buzzPage.createBuzzButton).toBeVisible();
  await buzzPage.openCreateBuzz();

  const marker = `Buzz-TC004 professor-create-probe ${Date.now()}`;
  await buzzPage.composeAndPublish(marker);

  await expect(buzzPage.cardByText(marker)).toBeVisible({ timeout: 10000 });
});
