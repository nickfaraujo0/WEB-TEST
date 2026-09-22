// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { CreateOpportunityPage } from './create-opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC015 — Verify if you can
 * choose multiple domains in 'Eligibility' criteria.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on the plus icon. 3. Click on
 * 'Jobs/Interviews'. 4. Click on the 'Eligibility' field. 5. Choose multiple fields.
 * Expected: professor should be able to choose multiple domains from the 'Eligibility'
 * field.
 *
 * N/A on web (same basis as TC008, re-confirmed): there is no "Eligibility" field on the
 * real create form for either Jobs or Internship, so there is nothing to select multiple
 * domains from.
 *
 * Split per type so Jobs and Internship are tracked as distinct test cases.
 */
test.describe('TC015 - Multiple domain selection in Eligibility (N/A on web)', () => {
  test('TC015-Jobs', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Jobs');
    await expect(page.getByText(/eligib/i)).toHaveCount(0);
  });

  test('TC015-Internship', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Internship');
    await expect(page.getByText(/eligib/i)).toHaveCount(0);
  });
});
