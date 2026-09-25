// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC042 — Check if board label appears on top right of
 * that buzz that has board attached.
 * Precondition: logged in. Steps: 1. Check if a label is displayed at the top right of a Buzz.
 * Expected result: not specified — inferred: a Buzz posted to a board shows that board's name
 * as a label in the card header's right side.
 *
 * Confirmed live: the label is an <a href="/Buzz/Board/<id>"> chip in the card header, left of
 * the "..." menu. Posts published without a board carry no label (see TC037).
 */
test('TC042 - Verify a board label shows at the top right of Buzzes that have a board', async ({ page }) => {
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  await expect(buzz.feedCards().first()).toBeVisible({ timeout: 15000 });
  await buzz.loadUntilPresent(buzz.boardLabels());

  const labels = buzz.boardLabels();
  expect(await labels.count()).toBeGreaterThan(0);

  const card = buzz.feedCards().filter({ has: labels }).first();
  const cardBox = await card.boundingBox();
  const labelBox = await card.locator('a[href^="/Buzz/Board/"]').first().boundingBox();
  expect(cardBox).not.toBeNull();
  expect(labelBox).not.toBeNull();

  expect(labelBox.x).toBeGreaterThan(cardBox.x + cardBox.width / 2);
  expect(labelBox.y).toBeLessThan(cardBox.y + 80);
  expect((await card.locator('a[href^="/Buzz/Board/"]').first().innerText()).trim().length).toBeGreaterThan(0);
});
