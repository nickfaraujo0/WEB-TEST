// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { CreateOpportunityPage, PreviewOpportunityPage } from './create-opportunity-page.js';
import { OpportunityPage } from './opportunity-page.js';
import { cleanupOpportunityByTitle } from './opportunities-helpers.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC010 — Verify if the
 * registration link works without specifying application deadline.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on the plus icon. 3. Click on
 * 'Jobs/Internship'. 4. Enter all the details except 'Application deadline'.
 * Expected: the user should be able to access the link.
 *
 * Tested with explicit user sign-off (2026-09-14) — publishes a real listing. Confirmed
 * live: leaving the Registration Deadline completely blank does not block publishing, and
 * the resulting "Register" button on the feed card is a real link carrying the exact
 * Registration URL entered, confirmed here via its href rather than by actually following an
 * external navigation.
 *
 * Cost note: like TC009, running this creates one new "QA Test" listing each time (one per
 * type below).
 *
 * Split per type so Jobs and Internship are tracked as distinct test cases.
 */
test.describe('TC010 - Registration link works without a deadline', () => {
  test('TC010-Jobs', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Jobs');

    const title = `QA Test - TC010-Jobs automated ${Date.now()} (safe to delete)`;
    await createPage.titleInput.fill(title);
    await createPage.fillDescription('QA automated test listing for TC010-Jobs. Safe to delete.');
    await createPage.selectOrganization('City', 'Grit City');
    await createPage.registrationUrlInput.fill('google.com');

    // Deadline deliberately left untouched — neither date nor time.
    await expect(createPage.deadlineDateInput).toHaveValue('');

    await createPage.previewButton.click();

    const previewPage = new PreviewOpportunityPage(page);
    await expect(previewPage.publishButton).toBeVisible({ timeout: 15000 });
    // No deadline line at all when none was set.
    await expect(previewPage.deadlineText).toHaveCount(0);
    await previewPage.publishButton.click();

    await expect(page).toHaveURL(/\/opportunity\//i, { timeout: 15000 });

    try {
      const opportunityPage = new OpportunityPage(page);
      await opportunityPage.jobsTab.click();

      // A freshly published listing appears as the first card in its tab's feed (confirmed
      // live) — the title heading and the first "Register" link on the page belong to it.
      await expect(page.getByText(title)).toBeVisible({ timeout: 15000 });
      const registerLink = page.getByRole('link', { name: 'Register' }).first();
      await expect(registerLink).toBeVisible();
      await expect(registerLink).toHaveAttribute('href', /google\.com/i);
    } finally {
      // This test publishes a real listing every run — unpublish it afterward so QA clutter
      // doesn't accumulate in the live Jobs feed. Best-effort: see opportunities-helpers.js.
      await cleanupOpportunityByTitle(page, 'Jobs', title);
    }
  });

  test('TC010-Internship', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Internship');

    const title = `QA Test - TC010-Internship automated ${Date.now()} (safe to delete)`;
    await createPage.titleInput.fill(title);
    await createPage.fillDescription('QA automated test listing for TC010-Internship. Safe to delete.');
    await createPage.selectOrganization('City', 'Grit City');
    await createPage.registrationUrlInput.fill('google.com');

    // Deadline deliberately left untouched — neither date nor time.
    await expect(createPage.deadlineDateInput).toHaveValue('');

    await createPage.previewButton.click();

    const previewPage = new PreviewOpportunityPage(page);
    await expect(previewPage.publishButton).toBeVisible({ timeout: 15000 });
    // No deadline line at all when none was set.
    await expect(previewPage.deadlineText).toHaveCount(0);
    await previewPage.publishButton.click();

    await expect(page).toHaveURL(/\/opportunity\//i, { timeout: 15000 });

    try {
      const opportunityPage = new OpportunityPage(page);
      await opportunityPage.internshipTab.click();

      await expect(page.getByText(title)).toBeVisible({ timeout: 15000 });
      const registerLink = page.getByRole('link', { name: 'Register' }).first();
      await expect(registerLink).toBeVisible();
      await expect(registerLink).toHaveAttribute('href', /google\.com/i);
    } finally {
      // This test publishes a real listing every run — unpublish it afterward so QA clutter
      // doesn't accumulate in the live Internship feed. Best-effort: see opportunities-helpers.js.
      await cleanupOpportunityByTitle(page, 'Internship', title);
    }
  });
});
