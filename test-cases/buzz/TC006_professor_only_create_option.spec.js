// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor, loginAsStudent } from './session.js';
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
    await loginAsProfessor(page);

    const buzzPage = new BuzzPage(page);
    await expect(buzzPage.createBuzzButton).toBeVisible();
  });

  test('student account does not see the Create Buzz button', async ({ page }) => {
    await loginAsStudent(page);

    const buzzPage = new BuzzPage(page);
    // Not asserting on `allTab` here: confirmed live it never leaves a loading state for a
    // Student account, while the feed itself renders fine underneath it — see TC005 for the
    // same note. This checks the feed loaded a different, confirmed-working way instead.
    await expect(buzzPage.cards.first()).toBeVisible({ timeout: 15000 });
    await expect(buzzPage.createBuzzButton).toHaveCount(0);
  });
});
