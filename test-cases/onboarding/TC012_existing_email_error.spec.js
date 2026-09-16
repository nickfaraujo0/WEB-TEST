// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';
import { credential } from '../login/credentials.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC012 — Verify error for existing
 * email address.
 * Precondition: none.
 * Steps (spreadsheet): 1. On the email input page, enter an email address that already
 * exists. 2. Tap the Continue button. 3. Observe the error message.
 * Expected (spreadsheet): an error message should be displayed for an existing email
 * address.
 *
 * Reinterpreted for web, tested with explicit user sign-off (2026-09-14) since this clicks
 * the real submit button against the live backend: uses the known existing account
 * (nolan@wafer.ee, the same throwaway account the Login suite signs in with) with an
 * otherwise-valid form.
 *
 * Expected (actual app behavior — a real gap, confirmed live before writing this test): the
 * app shows NOTHING. No inline error, no dialog, no toast, no navigation, and no session is
 * created (checked Firebase's IndexedDB session store directly — empty). The click has no
 * observable effect at all. So unlike TC011 (which does have working client-side
 * validation), an existing email is neither rejected with a message nor silently accepted —
 * it just goes nowhere. That's the actual finding this test documents: there is currently no
 * user-facing feedback for this case at all.
 */
test('TC012 - Verify error for existing email address', async ({ page }) => {
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  await signupPage.fill({
    name: 'Test User',
    email: credential('HIVE_VALID_EMAIL'),
    password: 'TestPass@123',
    confirmPassword: 'TestPass@123',
  });
  await signupPage.consentCheckbox.check();
  await expect(signupPage.submitButton).toBeEnabled();
  await signupPage.submitButton.click();

  // Give a real reaction (success or error) a fair chance to happen before asserting there
  // isn't one.
  await page.waitForTimeout(4000);

  await expect(page).toHaveURL(/\/signup/i);
  await expect(signupPage.errorDialog).not.toBeVisible();
  await expect(page.locator('.ant-form-item-explain-error')).toHaveCount(0);
});
