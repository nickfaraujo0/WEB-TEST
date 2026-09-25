// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC039 — Verify that clicking back on any stage shows a
 * pop up for "Discarding" or "Save as Draft".
 * Steps: 1. Go to Recipients/Boards page. 2. Click the top-left button. 3. Check the pop-up
 * appears.
 * Expected result: not specified — inferred: leaving the wizard with unsaved text asks
 * Discard / Save as Draft.
 *
 * Real gap, confirmed live: there is no top-left button on web. The wizard has a footer "Back"
 * (previous step, text preserved) and a top-right X. Clicking the X on Step 1, 2 and 3 with
 * text entered closes the wizard immediately — no Discard / Save as Draft pop-up on any step,
 * and the typed text is lost without warning. (The Appium suite has discardPopup helpers,
 * which suggests mobile does show one — not re-verified here.)
 */
async function openWizardAtStep(page, step, text) {
  await new BuzzPage(page).createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText(text);
  if (step >= 2) await create.goToRecipients();
  if (step >= 3) await create.nextButton.click();
  await expect(page.getByText(`Step ${step} / 4`)).toBeVisible();
  return create;
}

for (const step of [1, 2, 3]) {
  test(`TC039 - Step ${step}: closing with unsaved text shows no Discard/Draft pop-up (gap)`, async ({ page }) => {
    await loginAsProfessor(page);
    const create = await openWizardAtStep(page, step, `TC039 step ${step} close probe`);

    await create.closeWizardIcon.click();

    await expect(page.getByText(`Step ${step} / 4`)).not.toBeVisible();
    await expect(page.getByText(/discard|save as draft/i)).toHaveCount(0);
  });
}

test('TC039 - The footer Back button just returns to the previous step, keeping the text', async ({ page }) => {
  await loginAsProfessor(page);
  const create = await openWizardAtStep(page, 2, 'TC039 back probe');
  await page.getByRole('button', { name: 'Back', exact: true }).click();

  await expect(page.getByText('Step 1 / 4')).toBeVisible();
  await expect(create.textEditor).toHaveText('TC039 back probe');
  await expect(page.getByText(/discard|save as draft/i)).toHaveCount(0);
});
