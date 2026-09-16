// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC001 — Verify that "Buzz" is the default screen when
 * you open the app.
 * Steps: Log in.
 * Expected (inferred — spreadsheet leaves Expected Result blank for this row): the Buzz feed
 * is the screen shown immediately after login, with the "All" tab active.
 */
test('TC001 - Verify that Buzz is the default screen', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));

  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });
  const buzzPage = new BuzzPage(page);
  await expect(buzzPage.allTab).toBeVisible();
  await expect(buzzPage.createBuzzButton).toBeVisible();
});
