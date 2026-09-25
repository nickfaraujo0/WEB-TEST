// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC025 — Verify that "Everyone" is selected by default
 * on the Select Recipients step.
 * Precondition: on Create Buzz page, Select Recipients step.
 * Steps: 1. Advance to Select Recipients. 2. Check the default user type.
 * Expected result: not specified — inferred: the "Everyone" pill is pre-selected (highlighted)
 * without the user needing to click it.
 */
test('TC025 - Verify Everyone is the default-selected recipient type', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.createBuzzButton.click();

  const createPage = new CreateBuzzPage(page);
  await createPage.fillText('TC025 default-recipient probe');
  await createPage.goToRecipients();

  const everyonePill = createPage.recipientTypeButton('Everyone');
  const studentPill = createPage.recipientTypeButton('Student');
  const professorPill = createPage.recipientTypeButton('Professor');

  // The selected pill is a real <button> carrying a "bg-brandGreen" class — confirmed live
  // via DOM inspection; unselected pills don't have it.
  await expect(everyonePill).toHaveClass(/bg-brandGreen/);
  await expect(studentPill).not.toHaveClass(/bg-brandGreen/);
  await expect(professorPill).not.toHaveClass(/bg-brandGreen/);
});
