// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { CreateOpportunityPage } from './create-opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC008 — Verify if the
 * dropdown appears in the Eligibility criteria in Jobs/Internships.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on the plus icon. 3. Click on
 * 'Jobs/Internship'. 4. Click on the 'Eligibility' field.
 * Expected: dropdown should appear when clicked on the 'Eligibility' field.
 *
 * N/A on web (2026-09-14): there is no "Eligibility" field anywhere on the real create form
 * for either Jobs or Internship — confirmed live by reading the full rendered form for both
 * types. The actual mandatory/optional field set is: Job Type, Title, Description,
 * Organization Name, Website URL, Registration URL, Registration Deadline, and a file
 * upload. This test documents the absence for both types rather than skip outright.
 *
 * Split per type (was one test checking both) so Jobs and Internship are tracked separately.
 */
test.describe('TC008 - Eligibility dropdown (N/A on web)', () => {
  test('TC008-Jobs - Eligibility dropdown for Jobs (N/A on web)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Jobs');
    await expect(page.getByText(/eligib/i)).toHaveCount(0);
  });

  test('TC008-Internship - Eligibility dropdown for Internship (N/A on web)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Internship');
    await expect(page.getByText(/eligib/i)).toHaveCount(0);
  });
});
