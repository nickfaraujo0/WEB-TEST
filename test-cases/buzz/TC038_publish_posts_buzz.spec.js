// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC038 — Clicking on "Post Buzz" button should post the
 * Buzz.
 * Steps: 1. Go to Select Board. 2. Click "Post Buzz". 3. Check the Buzz gets posted.
 * Expected result: not specified — inferred: the wizard closes and the Buzz appears in the
 * feed (here with a board selected, to cover the board-attached path too).
 *
 * Naming difference: the button is labelled "Publish", not "Post Buzz".
 */
test('TC038 - Verify Publish posts the Buzz to the feed with its board label', async ({ page }) => {
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  const marker = `QA Test TC038 - publish probe ${Date.now()} (safe to delete)`;

  try {
  await buzz.createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText(marker);
  await create.publishWithBoard('Event Board');

  await expect(page.getByText('Step 3 / 4')).not.toBeVisible();
  await expect(page.getByText(marker)).toBeVisible({ timeout: 15000 });
  await expect(buzz.cardByText(marker).locator('a[href^="/Buzz/Board/"]')).toHaveText('Event Board');
  } finally {
    await buzz.cleanupPost(marker);
  }
});
