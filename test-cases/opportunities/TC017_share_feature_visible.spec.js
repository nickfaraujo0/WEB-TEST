// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC017 — Verify if 'Share'
 * feature is visible for opportunities.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on 'Jobs/Internship'. 3. Choose any
 * Jobs/Internship.
 * Expected: Share feature (button) should be visible.
 *
 * Confirmed live: Share lives behind the "..." menu on each card (not a standalone button),
 * alongside "View" (and, for professors, "Edit"/"Unpublish" too).
 *
 * Split per type (was Jobs-tab only) so Jobs and Internship are tracked as distinct cases.
 */
test.describe('TC017 - Share feature is visible on a listing', () => {
  test('TC017-Jobs', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const opportunityPage = new OpportunityPage(page);
    await opportunityPage.goto();
    await opportunityPage.jobsTab.click();

    await opportunityPage.openFirstCardMenu();
    await expect(opportunityPage.menuItem('Share')).toBeVisible();
  });

  test('TC017-Internship', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const opportunityPage = new OpportunityPage(page);
    await opportunityPage.goto();
    await opportunityPage.internshipTab.click();

    await opportunityPage.openFirstCardMenu();
    await expect(opportunityPage.menuItem('Share')).toBeVisible();
  });
});
