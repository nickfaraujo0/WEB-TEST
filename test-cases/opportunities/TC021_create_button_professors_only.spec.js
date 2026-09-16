// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC021 — Verify if create
 * opportunities button is only visible to professors.
 * Precondition: logged in.
 * Steps: 1. Navigate to Opportunities. 2. Check for the plus icon.
 * Expected: only professors should be able to see the 'Create' button (plus icon).
 *
 * Direct match on web, confirmed live for both roles. Uses the same Professor/Student pair
 * of throwaway accounts the DroidSwarm Appium suite already relies on.
 */
test.describe('TC021 - Verify the Create Opportunity button is professor-only', () => {
  test('professor account sees the Create Opportunity button', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const opportunityPage = new OpportunityPage(page);
    await opportunityPage.goto();

    await expect(opportunityPage.createOpportunityButton).toBeVisible();
  });

  test('student account does not see the Create Opportunity button', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_STUDENT_EMAIL'), credential('HIVE_STUDENT_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const opportunityPage = new OpportunityPage(page);
    await opportunityPage.goto();
    await expect(opportunityPage.jobsTab).toBeVisible();

    await expect(opportunityPage.createOpportunityButton).toHaveCount(0);
  });
});
