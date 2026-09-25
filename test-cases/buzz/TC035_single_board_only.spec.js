// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC035 — User should only be able to select one "Board".
 * Steps: 1. Select a board. 2. Try to select a 2nd board. 3. Check whether 2 boards get selected.
 * Expected result: not specified — inferred: never more than one board is selected.
 *
 * Confirmed live: each board card has a checkbox, but selecting a second board moves the
 * selection (the first one unchecks) rather than adding to it or blocking.
 */
test('TC035 - Verify only one board can be selected at a time', async ({ page }) => {
  await loginAsProfessor(page);
  await new BuzzPage(page).createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText('TC035 single-board probe');
  await create.goToRecipients();
  await create.nextButton.click();
  await expect(create.boardCards.first()).toBeVisible();

  await create.boardCard('Job Board').click();
  await expect(create.boardCard('Job Board').locator('input[type="checkbox"]')).toBeChecked();

  await create.boardCard('TPO').click();
  await expect(create.boardCard('TPO').locator('input[type="checkbox"]')).toBeChecked();
  await expect(create.boardCard('Job Board').locator('input[type="checkbox"]')).not.toBeChecked();
  await expect(create.wizardModal.locator('input[type="checkbox"]:checked')).toHaveCount(1);
});
