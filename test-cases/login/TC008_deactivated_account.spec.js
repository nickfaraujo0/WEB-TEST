// @ts-check
import { test } from '../_hive-live.mjs';

/**
 * Hive Test Cases.xlsx, sheet "Login", TC008 — Login with Deactivated Account.
 * Precondition (spreadsheet): "Account is deactivated".
 * Expected: "Your account is deactivated, contact support" error message.
 *
 * SKIPPED — not a failure. This precondition needs a Hive account that has actually been
 * deactivated on the backend. No such account is available (the credentials in
 * tests/web/login/credentials.js are all active), and there is no UI-reachable way to deactivate
 * an account from this test suite — that is an admin/backend action, out of scope here.
 * Attempting this would mean either guessing at an account that might be deactivated
 * (unreliable, could misreport a different failure as this one) or deactivating a real test
 * account as a side effect of running the suite (destructive, and not requested).
 *
 * Mirrors the same skip already recorded on the Appium side:
 * DroidSwarmQAgent-Knowledge/tests/appium/Hive/Login/TC008_deactivated_account.mjs
 *
 * To implement for real: get a confirmed-deactivated test account (or an admin API/endpoint
 * to deactivate one), then this becomes a normal login attempt asserting the dialog text
 * above, the same shape as TC002/TC003/TC004/TC007.
 */
test.skip('TC008 - Login with Deactivated Account', async () => {
  // No deactivated Hive account available — see file header.
});
