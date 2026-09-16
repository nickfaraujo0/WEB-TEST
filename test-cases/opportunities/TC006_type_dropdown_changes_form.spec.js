// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { CreateOpportunityPage } from './create-opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC006 — Verify the dropdown
 * from type in Jobs/Internship changes the Opportunity.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on the plus icon. 3. Click on
 * 'Jobs/Internship'. 4. Change the type of Opportunity.
 * Expected: the 'Opportunity' type should change based on the option clicked.
 *
 * Confirmed live: changing the in-page "Job Type: Job/Internship" dropdown does update the
 * form's field label (e.g. "Jobs Title" -> "Internship Title") — a direct match.
 */
test('TC006 - Verify Job Type dropdown changes the form fields', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const createPage = new CreateOpportunityPage(page);
  await createPage.goto('Jobs');
  await expect(page.getByText('Jobs Title')).toBeVisible();

  await createPage.selectJobType('Internship');
  await expect(page.getByText('Internship Title')).toBeVisible();
  await expect(page.getByText('Jobs Title')).not.toBeVisible();

  await createPage.selectJobType('Jobs');
  await expect(page.getByText('Jobs Title')).toBeVisible();
});
