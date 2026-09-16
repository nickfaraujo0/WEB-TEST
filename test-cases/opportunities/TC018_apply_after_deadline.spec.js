// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Hive Test Cases.xlsx, sheet "create & display jobsinternship", TC018 — Verify whether you
 * can apply for an opportunity after the deadline.
 * Precondition: logged in.
 * Steps: 1. Navigate to 'Opportunities'. 2. Click on 'Jobs/Internship'. 3. Choose any
 * Jobs/Internship. 4. Click on 'Apply now' button.
 * Expected: the user should NOT be able to apply for the opportunity after the deadline.
 *
 * Real bug, confirmed live: found an existing Jobs listing ("sasas" / samast squad) whose
 * deadline (9 January 2025) is long past relative to today. Its "Register" link is still
 * fully active — not disabled, `pointer-events: auto`, a real working href. Nothing in the
 * UI blocks or warns about applying after the deadline; the link behaves identically to one
 * with no deadline at all.
 */
test('TC018 - Verify the register link stays active after its deadline has passed (bug)', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const opportunityPage = new OpportunityPage(page);
  await opportunityPage.goto();
  await opportunityPage.jobsTab.click();

  // A pre-existing seeded listing with a deadline in the past (9 January 2025). It sits
  // further down the infinite-scroll feed as more listings accumulate above it (this suite
  // itself adds a few via TC009/TC010), so scroll the feed until it loads in.
  const deadlineText = page.getByText('9 January 2025');
  const scrollContainer = page.locator('.infinite-scroll-component');
  for (let attempt = 0; attempt < 20; attempt++) {
    if (await deadlineText.count() > 0) break;
    await scrollContainer.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(400);
  }
  await expect(deadlineText).toBeVisible({ timeout: 15000 });

  const result = await page.evaluate(() => {
    const deadlineEl = [...document.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && e.textContent.trim() === '9 January 2025',
    );
    let card = deadlineEl;
    for (let i = 0; i < 6; i++) card = card.parentElement;
    const registerLink = [...card.querySelectorAll('a')].find((a) => a.textContent.trim() === 'Register');
    return {
      found: !!registerLink,
      href: registerLink?.getAttribute('href'),
      disabled: registerLink?.hasAttribute('disabled') ?? null,
      pointerEvents: registerLink ? getComputedStyle(registerLink).pointerEvents : null,
    };
  });

  expect(result.found).toBe(true);
  expect(result.href).toBeTruthy();
  expect(result.disabled).not.toBe(true);
  expect(result.pointerEvents).not.toBe('none');
});
