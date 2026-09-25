// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC041 — Clicking on "Discard" should discard that buzz.
 * Steps: 1. Go to Recipients/Boards page. 2. Click the top-left button. 3. Check the pop-up.
 * 4. Click "Discard". 5. Go to create Buzz. 6. Check whether the buzz is discarded.
 * Expected result: not specified — inferred: the abandoned buzz is not posted and not restored.
 *
 * There is no "Discard" button (see TC039) — closing the wizard discards silently and
 * immediately. What can be verified is the outcome the case cares about: the abandoned text is
 * neither posted to the feed nor restored when Create Buzz is reopened.
 */
test('TC041 - Verify closing the wizard discards the buzz: not posted, not restored', async ({ page }) => {
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  const marker = `TC041 abandoned probe ${Date.now()}`;

  await buzz.createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText(marker);
  await create.goToRecipients();
  await create.nextButton.click(); // Step 3 — the furthest point before publishing
  await create.closeWizardIcon.click();
  await expect(page.getByText('Step 3 / 4')).not.toBeVisible();

  await expect(page.getByText(marker)).toHaveCount(0);
  await page.reload();
  await expect(buzz.feedCards().first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(marker)).toHaveCount(0);

  await page.getByRole('button', { name: 'Create Buzz' }).click();
  await expect(create.textEditor).toHaveText('');
});
