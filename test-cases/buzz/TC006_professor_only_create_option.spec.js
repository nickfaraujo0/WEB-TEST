// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC006 — Verify only a Professor sees the "Create Buzz"
 * option.
 * Precondition: logged in.
 * Steps: 1. Check for the create control as a Professor. 2. Check for it as a Student.
 * Expected: only the Professor account sees it.
 *
 * A plain visibility check (unlike TC004, which drives the option all the way to a
 * published post) — same shape as opportunities/TC021_create_button_professors_only.spec.js.
 */
test.describe('TC006 - Verify only a Professor sees the Create Buzz option', () => {
  test('professor account sees the Create Buzz button', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const buzzPage = new BuzzPage(page);
    await expect(buzzPage.createBuzzButton).toBeVisible();
  });

  test('student account does not see the Create Buzz button', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_STUDENT_EMAIL'), credential('HIVE_STUDENT_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const buzzPage = new BuzzPage(page);
    // Not asserting on `allTab` here: confirmed live it never leaves a loading state for a
    // Student account, while the feed itself renders fine underneath it — see TC005 for the
    // same note. This checks the feed loaded a different, confirmed-working way instead.
    await expect(buzzPage.cards.first()).toBeVisible({ timeout: 15000 });
    await expect(buzzPage.createBuzzButton).toHaveCount(0);
  });
});
