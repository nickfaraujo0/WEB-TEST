// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';
import { credential } from './credentials.js';

/**
 * Hive Test Cases.xlsx, sheet "Login", TC008 — Login with Deactivated Account.
 * Precondition (spreadsheet): "Account is deactivated".
 * Steps: go to login page -> enter the deactivated account's email and password -> click 'Login'.
 * Expected (spreadsheet): "Your account is deactivated, contact support" error message.
 *
 * Account: HIVE_DEACTIVATED_EMAIL / _PASSWORD in credentials.js (student0019@test.com), which the
 * user confirmed is deactivated (2026-09-25). Until then this case self-skipped for lack of one.
 *
 * Confirmed live (2026-09-25, chromium): the login is refused and the user stays on /login, but the
 * app shows the same generic "Login Failed" / "Invalid email or password" dialog as a wrong
 * password (TC002). Firebase answers `signInWithPassword` with INVALID_LOGIN_CREDENTIALS — not
 * USER_DISABLED — so the client has nothing to tell a deactivated account apart from bad
 * credentials, and the spreadsheet's "deactivated, contact support" message never appears.
 * Hence "(gap)": this asserts the real behavior (access denied, generic message) plus the absence
 * of any deactivation wording, and will fail — prompting an update — if that message ever ships.
 *
 * Caveat: from the browser a deactivated account is indistinguishable from a wrong password, so
 * this case relies on the account really being deactivated with the password above.
 */
test('TC008 - Login with Deactivated Account (gap)', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await loginPage.login(credential('HIVE_DEACTIVATED_EMAIL'), credential('HIVE_DEACTIVATED_PASSWORD'));

  // Access is denied: generic credential-failure dialog, no redirect into the app.
  await expect(loginPage.errorDialog).toContainText('Login Failed');
  await expect(loginPage.errorDialog).toContainText('Invalid email or password');
  await expect(page).toHaveURL(/\/login/i);

  // The gap: nothing tells the user their account is deactivated or to contact support.
  await expect(page.getByText(/deactivated|disabled|contact support/i)).toHaveCount(0);
});
