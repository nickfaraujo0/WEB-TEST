// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { CreateOpportunityPage } from './create-opportunity-page.js';

/**
 * Not in Hive Test Cases.xlsx — extends TC006's finding (the Job/Internship type dropdown
 * switches the form between those two) to the Events entry point, which TC006 never opened.
 *
 * Confirmed live before writing this: opening the "Event Type" dropdown from
 * /opportunity/create?type=Events lists Events' own sub-categories (Webinars and Workshops,
 * Contests, Cultural Events, Sports Events, Field Trips) AND, at the top, "Jobs" and
 * "Internship" as top-level type switches — the same shared `.ant-select.eventType` component
 * TC004/TC005/TC006 already use for Jobs/Internship. Picking "Jobs" from inside the Events
 * form is a real, working way to switch to the Jobs form, not just a display quirk.
 */
test('TC026 - Verify Event Type dropdown lists sub-categories and can switch to Jobs/Internship', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const createPage = new CreateOpportunityPage(page);
  await createPage.goto('Events');
  await expect(page.getByText('Event Title')).toBeVisible();

  await createPage.jobTypeSelect.click();
  const options = page.locator('.ant-select-item-option');
  for (const label of ['Jobs', 'Internship', 'Webinars and Workshops', 'Contests', 'Cultural Events', 'Sports Events', 'Field Trips']) {
    await expect(options.filter({ hasText: label })).toHaveCount(1);
  }
  // Close the dropdown opened above before selectJobType() opens it again — leaving it open
  // and immediately re-clicking the trigger toggles it shut instead, so the option click
  // that follows lands on a hidden element.
  await page.keyboard.press('Escape');

  await createPage.selectJobType('Jobs');
  await expect(page.getByText('Jobs Title')).toBeVisible();
  await expect(page.getByText('Event Title')).not.toBeVisible();
});
