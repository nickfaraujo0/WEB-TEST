// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { CreateOpportunityPage } from './create-opportunity-page.js';

/**
 * Not in Hive Test Cases.xlsx — TC009 confirms Jobs/Internship have exactly one
 * deadline date/time pair. Confirmed live before writing this: the Create Event form has
 * TWO independent date/time pairs — "Registration Deadline" and "Event Date" — a field this
 * suite had never exercised since only Jobs/Internship were ever created (TC004/TC005).
 */
test('TC027 - Verify Create Event has both a Registration Deadline and an Event Date', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const createPage = new CreateOpportunityPage(page);
  await createPage.goto('Events');

  await expect(page.getByText('Registration Deadline')).toBeVisible();
  await expect(page.getByText('Event Date')).toBeVisible();
  await expect(page.getByPlaceholder('Select date')).toHaveCount(2);
  await expect(page.getByPlaceholder('Select time')).toHaveCount(2);
});
