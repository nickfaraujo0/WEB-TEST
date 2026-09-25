// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC037 — Verify that user is able to create Buzz without
 * choosing a Board.
 * Steps: 1. Go to Select Board. 2. Don't select a board. 3. Click "Post Buzz". 4. Check the
 * Buzz gets posted.
 * Expected result: not specified — inferred: the Buzz posts, and carries no board label.
 *
 * Naming difference: the final button is labelled "Publish", not "Post Buzz". Confirmed live
 * that no board is preselected and the post appears with no board label on its card.
 */
test('TC037 - Verify a Buzz can be published without choosing a board', async ({ page }) => {
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  const marker = `QA Test TC037 - no board ${Date.now()} (safe to delete)`;

  try {
  await buzz.createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText(marker);
  await create.goToRecipients();
  await create.nextButton.click();
  await expect(create.wizardModal.locator('input[type="checkbox"]:checked')).toHaveCount(0);
  await create.publishButton.click();

  await expect(page.getByText(marker)).toBeVisible({ timeout: 15000 });
  await expect(buzz.cardByText(marker).locator('a[href^="/Buzz/Board/"]')).toHaveCount(0);
  } finally {
    await buzz.cleanupPost(marker);
  }
});
