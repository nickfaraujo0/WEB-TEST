// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC020 — Verify if you can
 * share the opportunities on buzz.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on 'Jobs/Internship'. 3. Choose any
 * Jobs/Internship. 4. Click on 'Share' icon button.
 * Expected: user should be able to share 'Opportunities' on 'Buzz'.
 *
 * N/A on web (2026-09-14): the Share dialog's options are Email, WhatsApp, Facebook, and
 * Copy Link only — confirmed for both a professor and a student account. There is no
 * "share to Buzz" option anywhere in the flow, for either role.
 */
test('TC020 - Verify sharing an opportunity to Buzz (N/A on web)', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const opportunityPage = new OpportunityPage(page);
  await opportunityPage.goto();
  await opportunityPage.jobsTab.click();

  await opportunityPage.openFirstCardMenu();
  await opportunityPage.clickMenuItem('Share');

  const dialog = opportunityPage.shareDialog();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Email')).toBeVisible();
  await expect(dialog.getByText('WhatsApp')).toBeVisible();
  await expect(dialog.getByText('Facebook')).toBeVisible();
  await expect(dialog.getByText('Copy Link')).toBeVisible();
  await expect(dialog.getByText(/buzz/i)).toHaveCount(0);
});
