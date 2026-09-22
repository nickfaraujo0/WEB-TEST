// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC022 — Verify if students
 * can copy the opportunities to share.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on 'Jobs/Internship'. 3. Choose any
 * Jobs/Internship. 4. Click on 'Share' icon button.
 * Expected: students should be able to copy 'Opportunities' to share.
 *
 * Direct match, confirmed live: logged in as the throwaway student account, the "..." menu
 * offers View and Share (professors additionally get Edit/Unpublish), and the Share dialog's
 * Copy Link option is present and works the same as for a professor.
 */
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

// Split per type (was Jobs-tab only) so Jobs and Internship are tracked as distinct cases.
test.describe('TC022 - A student can copy an opportunity link to share', () => {
  test('TC022-Jobs', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_STUDENT_EMAIL'), credential('HIVE_STUDENT_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const opportunityPage = new OpportunityPage(page);
    await opportunityPage.goto();
    await opportunityPage.jobsTab.click();

    await opportunityPage.openFirstCardMenu();
    // Students only ever see View/Share — no Edit or Unpublish.
    await expect(opportunityPage.menuItem('View')).toBeVisible();
    await expect(opportunityPage.menuItem('Share')).toBeVisible();
    await expect(opportunityPage.menuItem('Edit')).toHaveCount(0);
    await expect(opportunityPage.menuItem('Unpublish')).toHaveCount(0);

    await opportunityPage.clickMenuItem('Share');
    const dialog = opportunityPage.shareDialog();
    await expect(dialog).toBeVisible();
    await dialog.getByText('Copy Link', { exact: true }).click();

    // Copy Link copies a full share message with a real deep link embedded, not a bare URL.
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toMatch(/https?:\/\/\S+/);
  });

  test('TC022-Internship', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_STUDENT_EMAIL'), credential('HIVE_STUDENT_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const opportunityPage = new OpportunityPage(page);
    await opportunityPage.goto();
    await opportunityPage.internshipTab.click();

    await opportunityPage.openFirstCardMenu();
    await expect(opportunityPage.menuItem('View')).toBeVisible();
    await expect(opportunityPage.menuItem('Share')).toBeVisible();
    await expect(opportunityPage.menuItem('Edit')).toHaveCount(0);
    await expect(opportunityPage.menuItem('Unpublish')).toHaveCount(0);

    await opportunityPage.clickMenuItem('Share');
    const dialog = opportunityPage.shareDialog();
    await expect(dialog).toBeVisible();
    await dialog.getByText('Copy Link', { exact: true }).click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toMatch(/https?:\/\/\S+/);
  });
});
