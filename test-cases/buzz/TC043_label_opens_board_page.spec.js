// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC043 — If you click on the "Board Label" it should
 * direct you to that board page.
 * Steps: 1. Find a Buzz with label. 2. Click the label. 3. Check you land on the Board page.
 * Expected result: not specified — inferred: navigation to /Buzz/Board/<id> showing that
 * board's own posts.
 */
test('TC043 - Verify clicking a board label opens that board page', async ({ page }) => {
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  await expect(buzz.boardLabels().first()).toBeVisible({ timeout: 15000 });

  const label = buzz.boardLabels().first();
  const name = (await label.innerText()).trim();
  const href = await label.getAttribute('href');
  await label.click();

  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  await expect(buzz.feedCards().first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: /^(Follow|Unfollow)$/ })).toBeVisible();
});
