// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC011 — Verify if the
 * Jobs/Internship are getting displayed properly.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on 'Jobs/Internship'.
 * Expected: 'Jobs/Internship' should be displayed one after another.
 */
test('TC011 - Verify Jobs/Internship are displayed one after another', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const opportunityPage = new OpportunityPage(page);
  await opportunityPage.goto();
  await opportunityPage.jobsTab.click();

  const registerLinks = page.getByRole('link', { name: 'Register' });
  await expect(registerLinks.first()).toBeVisible({ timeout: 15000 });
  const count = await registerLinks.count();
  expect(count).toBeGreaterThan(1);

  // Cards are stacked in a vertical list, not overlapping in a single blob — the feed's
  // total scrollable height is many times a single card's height. Reading both via
  // evaluate (rather than Playwright's boundingBox()) sidesteps the "element not stable"
  // flakiness the actively-reflowing infinite-scroll list otherwise causes mid-scroll.
  const { scrollHeight, cardHeight } = await page.evaluate(() => {
    const container = document.querySelector('.infinite-scroll-component');
    const link = [...document.querySelectorAll('a')].find((a) => a.textContent.trim() === 'Register');
    const card = link?.closest('[class*="rounded"]') ?? link?.parentElement;
    return { scrollHeight: container?.scrollHeight ?? 0, cardHeight: card?.getBoundingClientRect().height ?? 0 };
  });
  expect(cardHeight).toBeGreaterThan(0);
  expect(scrollHeight).toBeGreaterThan(cardHeight * 1.5);
});
