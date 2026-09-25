// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor, loginAsProfessor2 } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC011 — Verify a Professor cannot Edit/Delete another Professor's Buzz.
 * Precondition (spreadsheet): a Buzz authored by a *different* Professor account.
 *
 * Previously skipped for lack of a second faculty account; HIVE_PROFESSOR2 (credentials.js) now
 * provides one. Professor A (HIVE_VALID_EMAIL) publishes a marker post; Professor B signs in in a
 * separate context and must see the post but no "..." (Edit/Delete) menu on it. The positive
 * control — A does see the menu on the same card — proves the menu locator works, so an absent
 * menu for B means "not allowed", not "wrong selector". A deletes the post afterwards.
 */
test("TC011 - Verify a Professor cannot edit/delete another Professor's Buzz", async ({ browser }) => {
  test.setTimeout(150000);
  const marker = `QA Test TC011 - other professor ${Date.now()} (safe to delete)`;

  const authorContext = await browser.newContext();
  const author = await authorContext.newPage();
  await loginAsProfessor(author);
  const authorBuzz = new BuzzPage(author);
  await authorBuzz.createBuzzButton.click();
  const create = new CreateBuzzPage(author);
  await create.fillText(marker);
  await create.publishWithDefaults();
  await expect(authorBuzz.cardByText(marker)).toBeVisible({ timeout: 15000 });

  try {
    // Positive control: the author has the menu on this card.
    await expect(authorBuzz.cardByText(marker).locator('.ant-dropdown-trigger.aspect-square:visible')).toHaveCount(1);

    const otherContext = await browser.newContext();
    const other = await otherContext.newPage();
    await loginAsProfessor2(other);
    const otherBuzz = new BuzzPage(other);
    await otherBuzz.loadUntilPresent(otherBuzz.cardByText(marker));
    const card = otherBuzz.cardByText(marker).first();
    await expect(card).toBeVisible();
    await expect(otherBuzz.createBuzzButton).toBeVisible(); // really signed in as a Professor
    await expect(card.locator('.ant-dropdown-trigger.aspect-square:visible')).toHaveCount(0);
    await otherContext.close();
  } finally {
    await authorBuzz.cleanupPost(marker);
    await authorContext.close();
  }
});
