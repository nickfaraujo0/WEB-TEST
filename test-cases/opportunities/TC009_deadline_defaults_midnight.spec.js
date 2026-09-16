// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { CreateOpportunityPage, PreviewOpportunityPage } from './create-opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC009 — Verify if the
 * application deadline in opportunities gets set to midnight.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on the plus icon. 3. Click on
 * 'Jobs/Internship'. 4. Enter the 'Application deadline'.
 * Expected (spreadsheet): the deadline should be shown as '11:59 PM'.
 *
 * Tested with explicit user sign-off (2026-09-14), since this publishes a real listing —
 * same category as an account-creating submission. Confirmed the actual behavior, both in
 * the Preview step and on the live published card: setting only a deadline DATE (no time —
 * the time field is a separate, optional picker that stays empty unless the user explicitly
 * sets it) never displays "11:59 PM" or any time at all. The Preview page shows a bare date
 * ("Deadline - 25.09.2026"), and the live feed card doesn't show the deadline at all. So the
 * spreadsheet's expected midnight-default behavior does not exist on web — this is a real
 * gap, not a wording difference like the login/onboarding suites' cases.
 *
 * Cost note: like any real create-flow E2E test, running this creates one new "QA Test"
 * Internship listing in the dev database each time.
 */
test('TC009 - Verify the deadline never displays a time (does not default to 11:59 PM)', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const createPage = new CreateOpportunityPage(page);
  await createPage.goto('Internship');

  await createPage.titleInput.fill('QA Test - TC009 automated (safe to delete)');
  await createPage.fillDescription('QA automated test listing for TC009. Safe to delete.');
  await createPage.selectOrganization('City', 'Grit City');

  // Date only — deliberately leave the time picker untouched.
  await createPage.deadlineDateInput.click();
  await page.locator('.ant-picker-cell-in-view').last().click();
  await expect(createPage.deadlineTimeInput).toHaveValue('');

  await createPage.previewButton.click();

  const previewPage = new PreviewOpportunityPage(page);
  await expect(previewPage.deadlineText).toBeVisible({ timeout: 15000 });
  const deadlineText = await previewPage.deadlineText.textContent();
  expect(deadlineText).not.toMatch(/\d{1,2}\s*[:.]\s*\d{2}\s*(am|pm)/i);
  expect(deadlineText).not.toContain('11:59');
});
