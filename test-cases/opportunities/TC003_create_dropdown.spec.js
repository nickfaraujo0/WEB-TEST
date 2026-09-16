// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC003 — Verify tapping the
 * plus icon, create opportunities pop up.
 * Precondition: logged in.
 * Steps: 1. Navigate to Opportunities. 2. Click on the plus icon.
 * Expected: pop up should appear for creating Jobs/Internship/Events.
 *
 * Wording note: there is no plus icon — the control is a labelled "Create Opportunity"
 * button, and clicking it opens a dropdown menu (not a modal pop up) with three options:
 * Create Event, Create Jobs, Create Internship.
 */
test('TC003 - Verify Create Opportunity menu appears', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const opportunityPage = new OpportunityPage(page);
  await opportunityPage.goto();
  await opportunityPage.openCreateMenu();

  await expect(opportunityPage.createEventLink()).toBeVisible();
  await expect(opportunityPage.createJobsLink()).toBeVisible();
  await expect(opportunityPage.createInternshipLink()).toBeVisible();
});
