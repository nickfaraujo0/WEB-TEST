// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC010 — Verify only a Professor can Delete a Buzz.
 * Precondition: logged in as a Professor, own post exists.
 * Steps: 1. Publish a disposable post. 2. Open its "..." menu. 3. Delete. 4. Confirm.
 * Expected: the post is removed from the feed.
 *
 * Confirmed live: Delete shows a confirmation dialog naming the exact post text being
 * removed ("Are you sure you want to delete this Buzz?") before it's final, then a "Buzz was
 * Deleted Successfully" toast. Self-cleaning, like the mobile suite's TC010.
 */
test('TC010 - Verify only a Professor can delete a Buzz', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  const marker = `Buzz-TC010 delete-me ${Date.now()}`;
  await buzzPage.openCreateBuzz();
  await buzzPage.composeAndPublish(marker);

  const card = buzzPage.cardByText(marker);
  await expect(card).toBeVisible({ timeout: 10000 });

  await buzzPage.deleteCard(card);

  await expect(buzzPage.cardByText(marker)).toHaveCount(0, { timeout: 10000 });
});
