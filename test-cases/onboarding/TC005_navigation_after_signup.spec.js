// @ts-check
import { test } from '../_hive-live.mjs';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC005 — Verify navigation to the form
 * page after selecting college.
 * Precondition: none.
 * Steps (spreadsheet): 1. On the college selection page, select a college. 2. Tap the Next
 * button. 3. Observe the navigation.
 * Expected (spreadsheet): user should be navigated to the form page.
 *
 * SKIPPED — not a failure, and not blocked by a missing precondition either. There's no
 * college-selection step on web (see TC003/TC004), but the closer equivalent — actually
 * clicking the real /signup form's submit button — creates a genuine new account in the dev
 * database. Per user decision (2026-09-14), that's out of scope for this pass: verify the
 * button reaches a clickable/enabled state (already proven in TC004_submit_button_enabled_
 * when_filled.spec.js) without following through on an actual submission.
 *
 * So what's confirmed: the button does become enabled once the form is valid (TC004). What's
 * NOT confirmed: where the app navigates to after a real submit. That would need either an
 * explicit go-ahead to create a throwaway account, or a specific account the user wants used.
 */
test('TC005 - Verify navigation after completing sign-up', async () => {
  test.skip(true, 'Actually submitting would create a real account in the dev database — needs explicit sign-off first — see file header.');
});
