// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC002 — Verify navigation
 * in opportunities.
 * Precondition: logged in.
 * Steps: 1. Click on the 'Opportunities'. 2. Click on the above buttons (Events, Jobs,
 * Internship). 3. Check if the opportunities change.
 * Expected: the content of the page should change depending on the tab chosen by the user.
 */
test('TC002 - Verify navigation in opportunities', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const opportunityPage = new OpportunityPage(page);
  await opportunityPage.goto();
  await expect(opportunityPage.heading).toBeVisible();

  // Events is the default active tab.
  await expect(await opportunityPage.isTabActive(opportunityPage.eventsTab)).toBe(true);

  await opportunityPage.jobsTab.click();
  await expect(await opportunityPage.isTabActive(opportunityPage.jobsTab)).toBe(true);
  await expect(await opportunityPage.isTabActive(opportunityPage.eventsTab)).toBe(false);

  await opportunityPage.internshipTab.click();
  await expect(await opportunityPage.isTabActive(opportunityPage.internshipTab)).toBe(true);
  await expect(await opportunityPage.isTabActive(opportunityPage.jobsTab)).toBe(false);
});
