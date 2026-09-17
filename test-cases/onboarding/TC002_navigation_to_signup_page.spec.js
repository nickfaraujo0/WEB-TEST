// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { SignupPage } from './signup-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC002 — Verify navigation to Sign-Up
 * page.
 * Precondition: none.
 * Steps (spreadsheet): 1. On the login screen, tap the 'Sign Up' button. 2. Observe the
 * navigation.
 * Expected (spreadsheet): user should be navigated to the page to select a college.
 *
 * Reinterpreted for web (per user decision, 2026-09-14): there is no 'Sign Up' button
 * anywhere on the web login screen — confirmed in both desktop and mobile viewports, nothing
 * in the page's DOM matches "Sign Up" text. So step 1 as written cannot be performed on web
 * at all; this is a real discoverability gap worth flagging on its own. The closest testable
 * equivalent is: does a sign-up screen exist and render correctly when reached directly (it
 * lives at /signup, undiscoverable but functional)? There is no "college selection" step on
 * web either — see signup-page.js for what the real form actually contains.
 */
test('TC002 - Verify navigation to Sign-Up page', async ({ page }) => {
  // Document the gap: no Sign Up affordance exists on the login screen itself.
  await page.goto('https://hive-dev.thegritcity.com/login', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/sign up/i)).toHaveCount(0);

  // The sign-up screen does exist and works when reached directly.
  const signupPage = new SignupPage(page);
  await signupPage.goto();

  await expect(page).toHaveURL(/\/signup/i);
  await expect(signupPage.nameInput).toBeVisible();
  await expect(signupPage.emailInput).toBeVisible();
  await expect(signupPage.passwordInput).toBeVisible();
  await expect(signupPage.confirmPasswordInput).toBeVisible();
});
