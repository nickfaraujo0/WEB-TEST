// @ts-check
import { test } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Login", TC006 — Remember Me.
 * Precondition: user is registered.
 * Steps (spreadsheet): go to login page -> check the "Remember Me" checkbox -> log in ->
 * close and reopen the app -> verify the user is still logged in.
 *
 * SKIPPED — not a failure. Checked live: hive-dev.thegritcity.com/login has no "Remember Me"
 * control anywhere on the page — Email, Password, "Forgot Password?" link, and the Log in
 * button is the whole form. Mirrors the same skip already recorded on the Appium side
 * (DroidSwarmQAgent-Knowledge/tests/appium/Hive/Login/TC006_remember_me.mjs), which found the
 * identical absence in the native app's tree.
 *
 * Self-upgrading, per that same file's convention: this doesn't skip blindly on faith that the
 * control is still missing — it checks the live page first, every run, and throws loudly
 * instead of skipping if a "Remember Me" control ever appears in a future build, so this case
 * gets implemented for real rather than staying silently skipped forever.
 */
test('TC006 - Remember Me', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  const rememberMe = page.getByText(/remember me/i);
  const present = await rememberMe.isVisible().catch(() => false);
  if (present) {
    throw new Error(
      'A "Remember Me" control now exists on the login page — implement TC006 for real instead of skipping it.'
    );
  }

  test.skip(true, 'No "Remember Me" control on the login page — see file header.');
});
