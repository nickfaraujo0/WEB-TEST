// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC013 — Verify tapping "+" opens Create Buzz.
 * Precondition: logged in as a Professor.
 * Steps: Tap "Create Buzz".
 * Expected: the Create Buzz composer opens, on step 1 of 4.
 *
 * "+" on mobile is the labelled "Create Buzz" button on web — same naming note as
 * opportunities' "plus icon" vs. "Create Opportunity" button.
 */
test('TC013 - Verify Create Buzz opens the composer', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.openCreateBuzz();

  await expect(buzzPage.wizard()).toBeVisible();
  await expect(buzzPage.wizard().getByText('Create Buzz')).toBeVisible();
  await expect(buzzPage.wizard().getByText('Step 1 / 4')).toBeVisible();
  await expect(buzzPage.composerEditor()).toBeVisible();
});
