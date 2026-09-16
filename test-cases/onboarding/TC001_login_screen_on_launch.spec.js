// @ts-check
import { test, expect } from '../_hive-live.mjs';

/**
 * Hive Test Cases.xlsx, sheet "Onboarding_Test_Cases", TC001 — Verify login screen on app
 * launch.
 * Precondition: none.
 * Steps (spreadsheet, mobile wording): 1. Install and open the app. 2. Observe the first
 * screen displayed.
 * Web equivalent: visit the site fresh (no stored session — Playwright already gives each
 * test its own clean browser context, so this is a true "first launch").
 * Expected: the login screen is displayed first.
 */
test('TC001 - Verify login screen on app launch', async ({ page }) => {
  await page.goto('https://hive-dev.thegritcity.com/');

  await expect(page).toHaveURL(/\/login/i);
  await expect(page.getByText('Log in to your account.')).toBeVisible();
  await expect(page.getByPlaceholder('Email')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();
});
