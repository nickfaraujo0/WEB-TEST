// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC040 — Check if clicking on "Save as Draft" saves the
 * buzz.
 * Steps: 1. Go to Recipients/Boards page. 2. Click the top-left button. 3. Check the pop-up.
 * 4. Click "Save as Draft". 5. Go to Create a buzz. 6. Check the buzz is saved as a Draft.
 * Expected result: not specified — inferred: reopening Create Buzz offers/restores the draft.
 *
 * Real gap (blocked by TC039): no "Save as Draft" option exists anywhere in the web wizard,
 * so there is nothing to click. Confirmed live that the closest equivalent — abandoning the
 * wizard and reopening it — starts from a blank editor with no draft indicator, and no draft
 * text appears anywhere on the Buzz page.
 */
test('TC040 - Verify no Save as Draft exists and abandoned text is not kept (gap)', async ({ page }) => {
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);

  await buzz.createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText('TC040 abandoned probe (safe to delete)');
  await create.goToRecipients();
  await expect(page.getByText(/save as draft/i)).toHaveCount(0);
  await create.closeWizardIcon.click();
  await expect(page.getByText('Step 2 / 4')).not.toBeVisible();

  await page.getByRole('button', { name: 'Create Buzz' }).click();
  await expect(page.getByText('Step 1 / 4')).toBeVisible();
  await expect(create.textEditor).toHaveText('');
  await expect(page.getByText(/draft/i)).toHaveCount(0);
});
