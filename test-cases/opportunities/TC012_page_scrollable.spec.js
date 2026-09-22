// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC012 — Verify if the
 * Jobs/Internship page is scrollable.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on 'Jobs/Internship'. 3. Scroll the
 * available content.
 * Expected: page should be scrollable.
 *
 * Confirmed live: the feed is a `react-infinite-scroll-component` — scrolling it loads more
 * listings as needed.
 *
 * Split per type (was Jobs-tab only) so Jobs and Internship are tracked as distinct cases.
 */
test.describe('TC012 - Feed is scrollable', () => {
  test('TC012-Jobs', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const opportunityPage = new OpportunityPage(page);
    await opportunityPage.goto();
    await opportunityPage.jobsTab.click();

    const scrollContainer = page.locator('.infinite-scroll-component');
    await expect(scrollContainer).toBeVisible();

    const before = await scrollContainer.evaluate((el) => el.scrollTop);
    await scrollContainer.evaluate((el) => { el.scrollTop = 800; });
    await page.waitForTimeout(500);
    const after = await scrollContainer.evaluate((el) => el.scrollTop);

    expect(after).toBeGreaterThan(before);
  });

  test('TC012-Internship', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const opportunityPage = new OpportunityPage(page);
    await opportunityPage.goto();
    await opportunityPage.internshipTab.click();

    const scrollContainer = page.locator('.infinite-scroll-component');
    await expect(scrollContainer).toBeVisible();

    const before = await scrollContainer.evaluate((el) => el.scrollTop);
    await scrollContainer.evaluate((el) => { el.scrollTop = 800; });
    await page.waitForTimeout(500);
    const after = await scrollContainer.evaluate((el) => el.scrollTop);

    expect(after).toBeGreaterThan(before);
  });
});
