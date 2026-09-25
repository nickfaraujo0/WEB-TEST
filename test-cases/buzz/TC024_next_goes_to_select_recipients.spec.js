// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC024 — Verify that clicking "Next" on the text step
 * redirects to the "Select Recipients" step.
 * Precondition: on Create Buzz page, text entered.
 * Steps: 1. Type text. 2. Click Next.
 * Expected result: not specified — inferred: the wizard advances to Step 2, "Select
 * Recipients".
 */
test('TC024 - Verify Next advances Step 1 to the Select Recipients step', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.createBuzzButton.click();

  const createPage = new CreateBuzzPage(page);
  await createPage.fillText('TC024 recipients-step probe');
  await createPage.goToRecipients();

  await expect(page.getByText('Step 2 / 4')).toBeVisible();
  await expect(page.getByText('Select Recipients')).toBeVisible();
});
