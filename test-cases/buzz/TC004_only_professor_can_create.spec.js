// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-page.js';
import { BuzzPage as BuzzFeedPage } from './buzz-feed-page.js';

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
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await expect(buzzPage.createBuzzButton).toBeVisible();
  await buzzPage.openCreateBuzz();

  const marker = `Buzz-TC004 professor-create-probe ${Date.now()}`;
  try {
    await buzzPage.composeAndPublish(marker);
    await expect(buzzPage.cardByText(marker)).toBeVisible({ timeout: 10000 });
  } finally {
    await new BuzzFeedPage(page).cleanupPost(marker);
  }
});
