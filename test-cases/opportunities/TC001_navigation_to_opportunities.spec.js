// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC001 — Verify navigation
 * to opportunities.
 * Precondition: logged in (uses the same throwaway professor account as the Login suite).
 * Steps: 1. Click on the 'Opportunities'. 2. Observe the navigation.
 * Expected: the user should be directed to the 'Opportunities' page.
 *
 * Note: the sidebar nav item is labelled "Opportunity" (singular); the page it opens is
 * titled "Events & Opportunities" at /opportunity/.
 */
test('TC001 - Verify navigation to opportunities', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  await page.getByRole('link', { name: 'Opportunity' }).click();

  await expect(page).toHaveURL(/\/opportunity\//i);
  const opportunityPage = new OpportunityPage(page);
  await expect(opportunityPage.heading).toBeVisible();
});
