// @ts-check
import { test } from '../_hive-live.mjs';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC015 — Verify user registration and
 * navigation to verification page.
 * Precondition: none.
 * Steps (spreadsheet): 1. Set a valid password on the password setup page. 2. Tap the
 * Continue button. 3. Observe the navigation.
 * Expected (spreadsheet): user should be registered and navigated to the verification page.
 *
 * SKIPPED — not a failure. This is the one case in the onboarding suite that requires a
 * fully valid, successful submission — a unique email, matching passwords, consent checked —
 * which really would register a new throwaway account in the dev database. Per user decision
 * (2026-09-14, consistent with the same call made on TC005), that's out of scope for this
 * pass without an explicit go-ahead or a specific account to use.
 *
 * What IS already confirmed elsewhere in this suite: the submit button correctly reaches an
 * enabled state once the form is genuinely valid (TC004, TC009), and invalid input is
 * handled predictably for the cases that could be checked without committing a real
 * registration (TC011, TC012). What's not confirmed: where a *successful* submission
 * navigates to, and whether a real verification step exists.
 */
test.skip('TC015 - Verify user registration and navigation to verification page', async () => {
  // Not run — see file header. Needs explicit sign-off to create a real account, same basis
  // as TC005.
});
