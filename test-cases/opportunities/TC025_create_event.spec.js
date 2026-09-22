// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { OpportunityPage } from './opportunity-page.js';

/**
 * Not in Hive Test Cases.xlsx — the Opportunities page has three types (Events, Jobs,
 * Internship; see the "Event Type" dropdown, which lists both event sub-categories and the
 * other two top-level types), but the existing suite (TC001-TC024) only ever creates Jobs
 * (TC004) and Internships (TC005) — Events had zero coverage. Confirmed live before writing
 * this: the "Create Opportunity" menu's "Create Event" link opens
 * /opportunity/create?type=Events with its own "Event Title" field and "Webinars and
 * Workshops" as the default Event Type, distinct from Jobs/Internship's "Jobs Title"/
 * "Internship Title" fields.
 *
 * Mirrors TC004/TC005's pattern: verifies the create form loads correctly for this type,
 * doesn't submit (submitting would create a real event in the dev database).
 */
test('TC025 - Verify you can create an event', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const opportunityPage = new OpportunityPage(page);
  await opportunityPage.goto();
  await opportunityPage.openCreateMenu();
  await opportunityPage.createEventLink().click();

  await expect(page).toHaveURL(/\/opportunity\/create\?type=Events/i);
  await expect(page.getByText('Create Opportunity', { exact: true })).toBeVisible();
  await expect(page.getByText('Event Title')).toBeVisible();
  await expect(page.locator('.ant-select.eventType')).toContainText('Webinars and Workshops');
});
