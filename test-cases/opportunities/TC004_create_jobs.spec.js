// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC004 — Verify you can
 * create jobs.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on the plus icon. 3. Click on 'Jobs'.
 * Expected: should be directed to the page to create 'Jobs'.
 */
test('TC004 - Verify you can create jobs', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const opportunityPage = new OpportunityPage(page);
  await opportunityPage.goto();
  await opportunityPage.openCreateMenu();
  await opportunityPage.createJobsLink().click();

  await expect(page).toHaveURL(/\/opportunity\/create\?type=Jobs/i);
  await expect(page.getByText('Create Opportunity', { exact: true })).toBeVisible();
  await expect(page.getByText('Jobs Title')).toBeVisible();
  await expect(page.locator('.ant-select.eventType')).toContainText('Jobs');
});
