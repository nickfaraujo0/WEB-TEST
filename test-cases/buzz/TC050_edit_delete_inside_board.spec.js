// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC050 — User should be able to "Edit/Delete" a buzz
 * inside the Board.
 * Steps: 1. Find a Buzz with label. 2. Click the label. 3. Click the 3 dots. 4. Check you can
 * Edit/Delete.
 * Expected result: not specified — inferred: on the board page, the author's own post offers
 * Edit and Delete exactly as on the main feed (TC009/TC010).
 *
 * Publishes a throwaway post to the Event Board, opens that board via the card's label, then
 * exercises Edit (wizard opens pre-filled) and Delete (confirm dialog, success message, post
 * gone) from the board page itself.
 */
test('TC050 - Verify a Professor can Edit and Delete their own Buzz from inside a Board', async ({ page }) => {
  test.setTimeout(120000);
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  const marker = `QA Test TC050 - board edit/delete ${Date.now()} (safe to delete)`;

  await buzz.createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText(marker);
  await create.publishWithBoard('Event Board');
  await expect(page.getByText(marker)).toBeVisible({ timeout: 15000 });

  await buzz.cardByText(marker).locator('a[href^="/Buzz/Board/"]').click();
  await expect(page).toHaveURL(/\/Buzz\/Board\//);
  await expect(page.getByText(marker)).toBeVisible({ timeout: 15000 });

  // Edit — scoped to the marker's own card: "first card" could be another of this account's posts.
  const card = buzz.cardByText(marker).first();
  await card.locator('.ant-dropdown-trigger.aspect-square:visible').click();
  await buzz.menuSettled();
  await expect(buzz.menuItem('Edit')).toBeVisible();
  await expect(buzz.menuItem('Delete')).toBeVisible();
  await buzz.menuItem('Edit').click();
  await expect(page.getByText('Edit Buzz')).toBeVisible();
  await expect(create.textEditor).toHaveText(marker);
  await create.closeWizardIcon.click();
  await expect(page.getByText('Edit Buzz')).not.toBeVisible();

  // Delete
  await card.locator('.ant-dropdown-trigger.aspect-square:visible').click();
  await buzz.menuSettled();
  await buzz.menuItem('Delete').click();
  await expect(page.getByText('Are you sure you want to delete this')).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Buzz was Deleted Successfully')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Okay' }).click();
  // Scoped to feed cards: the closed Edit wizard keeps the marker text in its hidden editor.
  await expect(buzz.cardByText(marker)).toHaveCount(0);
  await page.reload();
  await expect(buzz.feedCards().first()).toBeVisible({ timeout: 15000 });
  await expect(buzz.cardByText(marker)).toHaveCount(0);
});
