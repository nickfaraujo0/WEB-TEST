// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC026 — Verify that the user is able to switch between
 * the Student/Professor recipient tabs on the Select Recipients step.
 * Precondition: on Select Recipients step.
 * Steps: 1. Click "Student". 2. Click "Professor". 3. Check each becomes selected.
 * Expected result: not specified — inferred: clicking a pill selects it (and deselects the
 * others), confirmed by the "bg-brandGreen" selected-state class.
 */
test('TC026 - Verify Student/Professor recipient pills are switchable', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.createBuzzButton.click();

  const createPage = new CreateBuzzPage(page);
  await createPage.fillText('TC026 tab-switch probe');
  await createPage.goToRecipients();

  const everyonePill = createPage.recipientTypeButton('Everyone');
  const studentPill = createPage.recipientTypeButton('Student');
  const professorPill = createPage.recipientTypeButton('Professor');

  await studentPill.click();
  await expect(studentPill).toHaveClass(/bg-brandGreen/);
  await expect(everyonePill).not.toHaveClass(/bg-brandGreen/);
  await expect(professorPill).not.toHaveClass(/bg-brandGreen/);

  await professorPill.click();
  await expect(professorPill).toHaveClass(/bg-brandGreen/);
  await expect(studentPill).not.toHaveClass(/bg-brandGreen/);
  await expect(everyonePill).not.toHaveClass(/bg-brandGreen/);
});
