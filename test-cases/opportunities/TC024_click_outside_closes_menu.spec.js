// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC024 — Verify clicking
 * outside closes the 'Plus icon'.
 * Precondition: logged in.
 * Steps: 1. Navigate to Opportunities. 2. Click on the plus icon. 3. Click anywhere outside.
 * Expected: should close the 'Plus icon' (Create button) dropdown if clicked anywhere
 * outside.
 */
test('TC024 - Verify clicking outside closes the Create Opportunity menu', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const opportunityPage = new OpportunityPage(page);
  await opportunityPage.goto();
  await opportunityPage.openCreateMenu();

  await expect(opportunityPage.createJobsLink()).toBeVisible();

  await page.mouse.click(600, 500);

  await expect(opportunityPage.createJobsLink()).not.toBeVisible();
});
