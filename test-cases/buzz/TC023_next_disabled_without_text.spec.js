// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC023 — Verify that the "Next" button is enabled only
 * when text is entered on "Create a buzz" page.
 * Precondition: on Create Buzz page, Step 1 (text).
 * Steps: 1. Leave the text field empty, check Next. 2. Type text, check Next. 3. Clear the
 * text again, check Next.
 * Expected result: not specified — inferred: Next is disabled with no text, enabled once
 * there's text, and disabled again if the text is fully cleared.
 */
test('TC023 - Verify Next is only enabled while the text field has content', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.createBuzzButton.click();

  const createPage = new CreateBuzzPage(page);
  await expect(createPage.nextButton).toBeDisabled();

  await createPage.textEditor.click();
  await createPage.textEditor.pressSequentially('Some content');
  await expect(createPage.nextButton).toBeEnabled();

  await createPage.textEditor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Delete');
  await expect(createPage.nextButton).toBeDisabled();
});
