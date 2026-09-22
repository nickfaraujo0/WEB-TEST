// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC016 — Verify if 'Apply
 * now' button is visible for opportunities with link.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on 'Jobs/Internship'. 3. Choose any
 * Jobs/Internship.
 * Expected: Apply now button should be visible.
 *
 * Wording note: the live, published button is labelled "Register", not "Apply Now" — "Apply
 * Now" is only the label shown (disabled) on the pre-publish Preview step. Same underlying
 * feature, different name once it's actually live.
 *
 * Split per type (was Jobs-tab only) so Jobs and Internship are tracked as distinct cases.
 */
test.describe('TC016 - Apply/register button is visible for a listing with a link', () => {
  test('TC016-Jobs', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const opportunityPage = new OpportunityPage(page);
    await opportunityPage.goto();
    await opportunityPage.jobsTab.click();

    const registerLink = page.getByRole('link', { name: 'Register' }).first();
    await expect(registerLink).toBeVisible();
    const href = await registerLink.getAttribute('href');
    expect(href).toBeTruthy();
  });

  test('TC016-Internship', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const opportunityPage = new OpportunityPage(page);
    await opportunityPage.goto();
    await opportunityPage.internshipTab.click();

    const registerLink = page.getByRole('link', { name: 'Register' }).first();
    await expect(registerLink).toBeVisible();
    const href = await registerLink.getAttribute('href');
    expect(href).toBeTruthy();
  });
});
