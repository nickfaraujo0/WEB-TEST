// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from './login-page.js';
import { credential } from './credentials.js';

/**
 * TC014 — End-to-End Login Journey.
 * Not in Hive Test Cases.xlsx — a single E2E walk through the whole login lifecycle, requested
 * by the user (2026-09-25) alongside the one-behavior-per-file TC001–TC013.
 *
 * Steps (each is a test.step, so the report shows exactly which stage broke):
 *   1. Open the login page — the password field is masked, and the eye toggle reveals/re-masks it.
 *   2. Submit empty — generic "Login failed. Please try again." dialog, still on /login (as TC004).
 *   3. Valid email + wrong password — "Invalid email or password" dialog, still on /login (as TC002).
 *   4. Valid credentials, email in UPPERCASE, submitted with Enter — lands on /Buzz (TC011 + TC013).
 *   5. Profile menu (top-right dropdown) shows the signed-in account's email.
 *   6. Reload keeps the session; visiting /login while signed in bounces back to /Buzz.
 *   7. Logout → "Are you sure you want to Logout" confirm: "No" keeps the session, "Yes" signs out
 *      to /login, clears the Firebase session from IndexedDB, and /Buzz then redirects to /login.
 *
 * Confirmed live (2026-09-25, chromium) before writing: steps 5–7 — the profile menu is the
 * `.ant-dropdown-trigger.justify-end` in the header (no accessible name, no text), its menu lists
 * name, email, "My Profile", "Logout"; logout opens an antd confirm with "No"/"Yes"; after "Yes" the
 * `firebaseLocalStorage` store is empty and the app routes to /login.
 *
 * Deliberately left out: Forgot Password (TC005 sends a real reset email every run), the
 * whitespace-padded email bug (TC012), and TC006/TC008's missing preconditions.
 * Leaves no test data behind — the only state it creates is its own browser session.
 *
 * Rate limit: step 3 is a real failed password attempt on the shared account. Running this many
 * times in quick succession (e.g. --repeat-each across 3 browsers) trips Firebase's
 * "Too many attempts. Try again later", which then blocks even the valid login in step 4 for a
 * few minutes — seen 2026-09-25. That's the account being throttled, not a login bug.
 */
test('TC014 - End-to-End Login Journey', async ({ page }) => {
  // Eight stages and four full page loads of the ~7.6MB bundle (see playwright.config.js) —
  // well past the 60s per-test default that fits the single-behavior specs.
  test.setTimeout(180000);
  const loginPage = new LoginPage(page);
  const email = credential('HIVE_VALID_EMAIL');
  const password = credential('HIVE_VALID_PASSWORD');

  // Dismisses the antd error dialog so the next attempt starts from a clean form.
  async function closeErrorDialog() {
    await loginPage.errorDialog.getByRole('button').first().click();
    await expect(loginPage.errorDialog).toBeHidden();
  }

  await test.step('Login page loads with a masked password field', async () => {
    await loginPage.goto();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    await loginPage.passwordInput.fill(password);
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    const toggle = page.locator('.ant-input-password-icon');
    await toggle.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
    await toggle.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await loginPage.passwordInput.fill('');
  });

  await test.step('Empty submit is rejected', async () => {
    await loginPage.loginButton.click();
    await expect(loginPage.errorDialog).toContainText('Login failed. Please try again');
    await expect(page).toHaveURL(/\/login/i);
    await closeErrorDialog();
  });

  await test.step('Wrong password is rejected', async () => {
    await loginPage.login(email, credential('HIVE_INVALID_PASSWORD'));
    await expect(loginPage.errorDialog).toContainText('Login Failed');
    // Firebase throttles the shared account after repeated failures (see header) — name that
    // outright instead of letting it read as a wording mismatch.
    const dialogText = (await loginPage.errorDialog.innerText()).trim();
    expect(dialogText, 'Account is rate-limited by Firebase ("Too many attempts") — wait a few minutes and re-run').not.toContain('Too many attempts');
    await expect(loginPage.errorDialog).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/\/login/i);
    await closeErrorDialog();
  });

  await test.step('Valid login (uppercase email, Enter key) lands on Buzz', async () => {
    await loginPage.emailInput.fill(email.toUpperCase());
    await loginPage.passwordInput.fill(password);
    await loginPage.passwordInput.press('Enter');
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 30000 });
  });

  // Header profile trigger: the only `.ant-dropdown-trigger` with `justify-end` (confirmed live);
  // it has no text or accessible name, so there's no role/text locator for it.
  const profileTrigger = page.locator('.ant-dropdown-trigger.justify-end').first();
  const profileMenu = page.locator('.ant-dropdown:not(.ant-dropdown-hidden)');
  const logoutItem = profileMenu.getByText('Logout', { exact: true });

  // Right after a navigation the header re-renders while the session is restored, and a click
  // on the trigger in that window is silently lost (seen on Firefox: menu never opened). Retry
  // the click until the menu is actually showing rather than trusting a single one.
  async function openProfileMenu() {
    await expect(async () => {
      if (!(await logoutItem.isVisible())) await profileTrigger.click();
      await expect(logoutItem).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20000 });
  }

  await test.step('Profile menu shows the signed-in account', async () => {
    await openProfileMenu();
    await expect(profileMenu).toContainText(email);
    await page.keyboard.press('Escape');
  });

  await test.step('Session survives a reload and /login bounces back to Buzz', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/Buzz/i);
    // The bounce only happens once the app has booted and restored the Firebase session.
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 30000 });
  });

  const logoutConfirm = page.getByRole('dialog').filter({ hasText: 'Are you sure you want to Logout' });

  await test.step('Cancelling logout keeps the session', async () => {
    await openProfileMenu();
    await logoutItem.click();
    await logoutConfirm.getByRole('button', { name: 'No', exact: true }).click();
    await expect(logoutConfirm).toBeHidden();
    await expect(page).toHaveURL(/\/Buzz/i);
  });

  await test.step('Confirming logout signs out and protects Buzz', async () => {
    await openProfileMenu();
    await logoutItem.click();
    await logoutConfirm.getByRole('button', { name: 'Yes', exact: true }).click();
    await expect(logoutConfirm).toBeHidden();
    await expect(page).toHaveURL(/\/login/i, { timeout: 30000 });

    // The Firebase session itself is gone, not just the route — otherwise a reload could sign back in.
    const storedSessions = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const req = indexedDB.open('firebaseLocalStorageDb');
          req.onerror = () => resolve(0);
          req.onsuccess = () => {
            const get = req.result.transaction('firebaseLocalStorage').objectStore('firebaseLocalStorage').getAll();
            get.onsuccess = () => resolve(get.result.length);
          };
        })
    );
    expect(storedSessions).toBe(0);

    await page.goto('/Buzz', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/i);
    await expect(loginPage.emailInput).toBeVisible();
  });
});
