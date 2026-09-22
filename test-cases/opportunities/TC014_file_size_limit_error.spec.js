// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { CreateOpportunityPage } from './create-opportunity-page.js';
import path from 'path';

const fixturesDir = path.join(process.cwd(), 'test-cases', 'opportunities', 'fixtures');

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC014 — Verify if a proper
 * error message is shown if file size above certain limit.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on the plus icon. 3. Click on
 * 'Jobs/Internship'. 4. Upload the file.
 * Expected: a proper error message should be displayed.
 *
 * Real gap, confirmed live: selecting an oversized file (~29MB PNG, well over any
 * reasonable limit) produces NOTHING — no filename appears in the "Attach Files" modal, no
 * inline error, no toast, and no console error either. The same silent-failure pattern seen
 * elsewhere in this app (e.g. Onboarding TC012's existing-email case): the file is rejected
 * without telling the user why, or even that anything happened at all.
 *
 * Split per type (was Internship only) so Jobs and Internship are tracked as distinct cases.
 */
test.describe('TC014 - Oversized file upload shows no error message (bug)', () => {
  test('TC014-Jobs', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Jobs');

    await page.getByText('Click to Browse Media or your Files').click();
    await page.locator('input[type="file"]').setInputFiles(path.join(fixturesDir, 'large-test.png'));
    await page.waitForTimeout(3000);

    // No filename listed, no error text, no dialog — the selection silently did nothing.
    await expect(page.getByText('large-test.png')).not.toBeVisible();
    await expect(page.getByText('large_test.png')).not.toBeVisible();
    await expect(page.locator('.ant-form-item-explain-error')).toHaveCount(0);
    await expect(page.getByText(/too large|exceeds|maximum|limit/i)).toHaveCount(0);
  });

  test('TC014-Internship', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const createPage = new CreateOpportunityPage(page);
    await createPage.goto('Internship');

    await page.getByText('Click to Browse Media or your Files').click();
    await page.locator('input[type="file"]').setInputFiles(path.join(fixturesDir, 'large-test.png'));
    await page.waitForTimeout(3000);

    await expect(page.getByText('large-test.png')).not.toBeVisible();
    await expect(page.getByText('large_test.png')).not.toBeVisible();
    await expect(page.locator('.ant-form-item-explain-error')).toHaveCount(0);
    await expect(page.getByText(/too large|exceeds|maximum|limit/i)).toHaveCount(0);
  });
});
