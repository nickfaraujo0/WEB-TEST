// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { CreateOpportunityPage } from './create-opportunity-page.js';
import path from 'path';

const fixturesDir = path.join(process.cwd(), 'test-cases', 'opportunities', 'fixtures');

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC013 — Verify the 'Tap
 * upload files' uploads the file.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on the plus icon. 3. Click on
 * 'Jobs/Internship'. 4. Upload the file.
 * Expected: files should be uploaded for that particular event.
 *
 * Confirmed live: clicking "Click to Browse Media or your Files" dynamically creates a file
 * input (not present in the DOM beforehand) and opens an "Attach Files" modal showing the
 * selected file and an "Upload" button. Clicking Upload replaces the browse area with the
 * attached file's name and size.
 *
 * Split per type (was Internship only) so Jobs and Internship are tracked as distinct cases.
 */
test.describe('TC013 - Uploading a file attaches it to the listing', () => {
  test('TC013-Jobs', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Jobs');

    await page.getByText('Click to Browse Media or your Files').click();
    await page.locator('input[type="file"]').setInputFiles(path.join(fixturesDir, 'small-test.png'));

    const attachDialog = page.getByText('Attach Files');
    await expect(attachDialog).toBeVisible();
    await expect(page.getByText('small-test.png')).toBeVisible();

    await page.getByRole('button', { name: 'Upload', exact: true }).click();

    await expect(page.getByText('small_test.png')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Click to Browse Media or your Files')).not.toBeVisible();
  });

  test('TC013-Internship', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Internship');

    await page.getByText('Click to Browse Media or your Files').click();
    await page.locator('input[type="file"]').setInputFiles(path.join(fixturesDir, 'small-test.png'));

    const attachDialog = page.getByText('Attach Files');
    await expect(attachDialog).toBeVisible();
    await expect(page.getByText('small-test.png')).toBeVisible();

    await page.getByRole('button', { name: 'Upload', exact: true }).click();

    await expect(page.getByText('small_test.png')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Click to Browse Media or your Files')).not.toBeVisible();
  });
});
