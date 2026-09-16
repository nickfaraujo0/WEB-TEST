// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC005 — Verify a Student should not be able to create a
 * Buzz.
 * Precondition: logged in as a Student.
 * Steps: 1. Look for a create control. 2. Confirm none exists.
 * Expected: a Student has no way to open the Create Buzz composer at all.
 *
 * Mirrors the mobile suite's TC005: the restriction is enforced by omitting the control, not
 * by rejecting an attempt to open it — so this asserts absence of both the button and the
 * wizard itself, rather than trying (and failing) to open it.
 */
test('TC005 - Verify a Student cannot create a Buzz', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_STUDENT_EMAIL'), credential('HIVE_STUDENT_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const buzzPage = new BuzzPage(page);
  // Not asserting on `allTab` here: confirmed live that its "All"/board tab bar never leaves
  // a loading state for a Student account (still spinning after 15s+), while the feed itself
  // renders normally underneath it — worth a separate look, but orthogonal to this test's
  // create-button concern, so this checks the feed loaded a different, confirmed-working way.
  await expect(buzzPage.cards.first()).toBeVisible({ timeout: 15000 });
  await expect(buzzPage.createBuzzButton).toHaveCount(0);
  await expect(buzzPage.wizard()).toHaveCount(0);
});
