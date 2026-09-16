// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC023 — Verify if only
 * professor can share the opportunities on buzz.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on 'Jobs/Internship'. 3. Choose any
 * Jobs/Internship. 4. Click on 'Share' icon button.
 * Expected: professor only should be able to share 'Opportunities' on 'Buzz'.
 *
 * N/A on web (2026-09-14): same basis as TC020 — there is no "share to Buzz" feature at all,
 * for either role, so there is no role restriction to verify. Confirmed the professor's
 * Share dialog is byte-for-byte the same four options (Email, WhatsApp, Facebook, Copy Link)
 * as the student's.
 */
test('TC023 - Verify professor-only Buzz sharing (N/A on web)', async ({ page }) => {
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
  await expect(dialog.getByText(/buzz/i)).toHaveCount(0);
});
