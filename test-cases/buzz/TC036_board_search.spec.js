// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC036 — User should be able to search for "Boards" in
 * the search bar.
 * Expected result: not specified — inferred: typing filters the list to matching boards.
 *
 * Confirmed live: searching "job" leaves only "Job Board". Searching a term with no match
 * ("zzzz") empties the list with no "no results" message at all — a small UX gap, asserted as
 * observed below.
 */
test('TC036 - Verify searching filters the board list', async ({ page }) => {
  await loginAsProfessor(page);
  await new BuzzPage(page).createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText('TC036 board-search probe');
  await create.goToRecipients();
  await create.nextButton.click();
  await expect(create.boardCards.first()).toBeVisible();
  const total = await create.boardCards.count();
  expect(total).toBeGreaterThan(1);

  await create.boardSearchInput.fill('job');
  await expect(create.boardCards).toHaveCount(1);
  await expect(create.boardCard('Job Board')).toBeVisible();

  await create.boardSearchInput.fill('zzzz');
  await expect(create.boardCards).toHaveCount(0);
  await expect(create.wizardModal.getByText(/no (boards|results|match)|not found/i)).toHaveCount(0);

  await create.boardSearchInput.fill('');
  await expect(create.boardCards).toHaveCount(total);
});
