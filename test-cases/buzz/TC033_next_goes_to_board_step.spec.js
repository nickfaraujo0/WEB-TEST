// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC033 — After clicking "Next" user should be directed
 * to "Select Board" page.
 * Steps: 1. Choose Recipients. 2. Click Next. 3. Check you land on "Select Boards".
 * Expected result: not specified — inferred: the wizard advances to the board step.
 *
 * Naming difference: the step is titled "Choose Buzz Board" (Step 3 / 4), not "Select Board".
 */
test('TC033 - Verify Next from Recipients lands on the Choose Buzz Board step', async ({ page }) => {
  await loginAsProfessor(page);
  await new BuzzPage(page).createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText('TC033 board-step probe');
  await create.goToRecipients();
  await create.nextButton.click();

  await expect(page.getByText('Step 3 / 4')).toBeVisible();
  await expect(page.getByText('Choose Buzz Board')).toBeVisible();
  await expect(create.publishButton).toBeVisible();
});
