// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { ProfilePage } from './profile-page.js';

/**
 * Hive Test Cases Playwright.xlsx, sheet "Profile" (Android row TC003; web TC002) — Change Password flow.
 * Precondition: logged in, on Profile screen.
 * Steps: 1. Open Profile. 2. Tap "Change Password".
 * Expected (Android): a "Verify it's you" screen offering to email a secure link.
 *
 * Confirmed live on web: "Change Password" opens a "Reset Password" dialog ("A password reset
 * link will be sent to your registered email address...") with Cancel and Send Reset Link.
 * Send Reset Link is deliberately never clicked — it would email the real account.
 */
test('TC002 - Verify Change Password opens a Reset Password dialog', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const profile = new ProfilePage(page);
  await profile.goto();

  await profile.changePasswordButton.click();

  await expect(profile.resetDialog).toBeVisible();
  await expect(profile.resetDialog).toContainText('Reset Password');
  await expect(profile.resetDialog).toContainText(/reset link will be sent to your registered email/i);
  await expect(profile.resetDialog.getByRole('button', { name: 'Send Reset Link' })).toBeVisible();
  await expect(profile.resetDialog.getByRole('button', { name: 'Cancel' })).toBeVisible();

  await profile.resetDialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(profile.resetDialog).not.toBeVisible();
});
