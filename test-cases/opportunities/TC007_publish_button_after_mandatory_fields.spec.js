// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { CreateOpportunityPage, PreviewOpportunityPage } from './create-opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC007 — Verify publish
 * button appears only after mandatory fields are filled.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on the plus icon. 3. Click on
 * 'Jobs/Internship'. 4. Fill in the mandatory details.
 * Expected: Publish button should appear.
 *
 * Reinterpreted from what actually exists, confirmed live: there is no button literally
 * labelled "Publish" on the create form itself — the form's submit button is always visible
 * and always enabled, labelled "Preview". Clicking it with mandatory fields empty triggers a
 * real antd inline validation error ("Please provide a title for the event" — note it says
 * "event" even when creating an Internship, the same stuck-on-"Event" wording bug seen
 * elsewhere in this flow) and does not navigate anywhere. Only once the mandatory fields
 * (Title, Description, Organization) are genuinely filled does clicking "Preview" navigate
 * to a Preview page, and THAT page is where the real "Publish" button lives. So the
 * underlying intent holds — Publish is unreachable until mandatory fields are filled — just
 * via inline validation plus an intermediate Preview step, not the button appearing in
 * place. Split into two fresh page loads because submitting the empty form once mutates the
 * Organization field's placeholder attribute, which would make the second half unreliable if
 * chained on the same page.
 */
test.describe('TC007 - Publish is only reachable after mandatory fields are filled', () => {
  test('empty form: Preview shows inline validation and does not navigate', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Internship');

    await createPage.previewButton.click();

    await expect(createPage.fieldError.first()).toBeVisible();
    await expect(page).toHaveURL(/\/opportunity\/create/i);
  });

  test('complete form: Preview navigates to a page with a visible Publish button', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Internship');

    await createPage.titleInput.fill('QA Test - TC007 (safe to delete)');
    await createPage.fillDescription('QA automated test listing for TC007. Safe to delete.');
    await createPage.selectOrganization('City', 'Grit City');

    await createPage.previewButton.click();

    const previewPage = new PreviewOpportunityPage(page);
    await expect(previewPage.publishButton).toBeVisible({ timeout: 15000 });
  });
});
