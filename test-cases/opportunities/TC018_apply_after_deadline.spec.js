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
 *
 * Split per type. TC018-Internship has NOT been confirmed live — unlike TC018-Jobs, no
 * specific past-deadline Internship listing is known to exist, so it scans the feed for any
 * spelled-out date ("D Month YYYY") in the past instead of matching one hardcoded string.
 * Run it once before trusting it: if the dev database has no past-deadline Internship
 * listing at all, the final assertion will time out — that's a real gap to seed, not a test
 * bug to silently work around.
 */
test.describe('TC018 - Register link stays active after its deadline has passed (bug)', () => {
  test('TC018-Jobs', async ({ page }) => {
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

  test('TC018-Internship', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
    await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

    const opportunityPage = new OpportunityPage(page);
    await opportunityPage.goto();
    await opportunityPage.internshipTab.click();

    // No specific past-deadline Internship listing is known to exist (unlike TC018-Jobs'
    // seeded "9 January 2025" one), so scroll and scan for ANY spelled-out date in the past
    // rather than matching one hardcoded string.
    const scrollContainer = page.locator('.infinite-scroll-component');
    const findPastDeadlineCard = () => page.evaluate(() => {
      const dateRe = /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/;
      const today = new Date();
      const candidate = [...document.querySelectorAll('*')]
        .find((e) => {
          if (e.children.length !== 0) return false;
          const match = e.textContent.trim().match(dateRe);
          return match && new Date(match[0]) < today;
        });
      if (!candidate) return null;
      let card = candidate;
      for (let i = 0; i < 6 && card.parentElement; i++) card = card.parentElement;
      const registerLink = [...card.querySelectorAll('a')].find((a) => a.textContent.trim() === 'Register');
      return {
        found: !!registerLink,
        href: registerLink?.getAttribute('href'),
        disabled: registerLink?.hasAttribute('disabled') ?? null,
        pointerEvents: registerLink ? getComputedStyle(registerLink).pointerEvents : null,
      };
    });

    let result = await findPastDeadlineCard();
    for (let attempt = 0; attempt < 20 && !result; attempt++) {
      await scrollContainer.evaluate((el) => { el.scrollTop = el.scrollHeight; });
      await page.waitForTimeout(400);
      result = await findPastDeadlineCard();
    }

    expect(result, 'no Internship listing with a past deadline was found in the feed').toBeTruthy();
    expect(result.found).toBe(true);
    expect(result.href).toBeTruthy();
    expect(result.disabled).not.toBe(true);
    expect(result.pointerEvents).not.toBe('none');
  });
});
