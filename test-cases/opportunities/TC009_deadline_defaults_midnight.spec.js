// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { CreateOpportunityPage, PreviewOpportunityPage } from './create-opportunity-page.js';
import { cleanupOpportunityByTitle } from './opportunities-helpers.js';

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
 * listing in the dev database each time (one per type below). Confirmed live via network
 * capture that clicking "Preview" alone already fires the CreateEvent endpoint — the record
 * exists the moment Preview is reached, before any Publish click — so this test completes the
 * publish itself (rather than stopping at Preview) and then unpublishes its own listing via
 * `cleanupOpportunityByTitle`, the same best-effort cleanup TC010 uses, so no half-created
 * draft or published QA clutter is left behind either way.
 *
 * Split per type so Jobs and Internship are tracked as distinct test cases.
 */
test.describe('TC009 - Deadline never displays a time (does not default to 11:59 PM)', () => {
  test('TC009-Jobs', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Jobs');

    const title = `QA Test - TC009-Jobs automated ${Date.now()} (safe to delete)`;
    await createPage.titleInput.fill(title);
    await createPage.fillDescription('QA automated test listing for TC009-Jobs. Safe to delete.');
    await createPage.selectOrganization('City', 'Grit City');

    // Date only — deliberately leave the time picker untouched.
    await createPage.deadlineDateInput.click();
    await page.locator('.ant-picker-cell-in-view').last().click();
    await expect(createPage.deadlineTimeInput).toHaveValue('');

    await createPage.previewButton.click();

    const previewPage = new PreviewOpportunityPage(page);
    try {
      await expect(previewPage.deadlineText).toBeVisible({ timeout: 15000 });
      const deadlineText = await previewPage.deadlineText.textContent();
      expect(deadlineText).not.toMatch(/\d{1,2}\s*[:.]\s*\d{2}\s*(am|pm)/i);
      expect(deadlineText).not.toContain('11:59');
    } finally {
      // Preview already created the real backend record (see header comment) — complete the
      // publish so it ends up in a known, unpublishable state rather than an orphaned draft.
      // cleanupOpportunityByTitle navigates to the listing page itself, so no extra nav here.
      await previewPage.publishButton.click().catch(() => {});
      await cleanupOpportunityByTitle(page, 'Jobs', title);
    }
  });

  test('TC009-Internship', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Internship');

    const title = `QA Test - TC009-Internship automated ${Date.now()} (safe to delete)`;
    await createPage.titleInput.fill(title);
    await createPage.fillDescription('QA automated test listing for TC009-Internship. Safe to delete.');
    await createPage.selectOrganization('City', 'Grit City');

    // Date only — deliberately leave the time picker untouched.
    await createPage.deadlineDateInput.click();
    await page.locator('.ant-picker-cell-in-view').last().click();
    await expect(createPage.deadlineTimeInput).toHaveValue('');

    await createPage.previewButton.click();

    const previewPage = new PreviewOpportunityPage(page);
    try {
      await expect(previewPage.deadlineText).toBeVisible({ timeout: 15000 });
      const deadlineText = await previewPage.deadlineText.textContent();
      expect(deadlineText).not.toMatch(/\d{1,2}\s*[:.]\s*\d{2}\s*(am|pm)/i);
      expect(deadlineText).not.toContain('11:59');
    } finally {
      // Preview already created the real backend record (see header comment) — complete the
      // publish so it ends up in a known, unpublishable state rather than an orphaned draft.
      // cleanupOpportunityByTitle navigates to the listing page itself, so no extra nav here.
      await previewPage.publishButton.click().catch(() => {});
      await cleanupOpportunityByTitle(page, 'Internship', title);
    }
  });
});
