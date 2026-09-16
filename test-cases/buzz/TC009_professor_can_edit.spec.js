// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC009 — Verify only a Professor can Edit a Buzz.
 * Precondition: logged in as a Professor, own post exists.
 * Steps: 1. Publish a post. 2. Open its "..." menu. 3. Edit. 4. Change the text. 5. Publish.
 * Expected: the edited text replaces the original in the feed.
 *
 * Confirmed live: "Edit" reopens the identical 4-step wizard, titled "Edit Buzz" instead of
 * "Create Buzz", pre-filled with the existing text — same component, not a separate editor.
 * The one difference: step 3's submit button reads "Save" in edit mode, not "Publish".
 * Publishes and then edits a real marker post on the shared dev feed, mirroring the mobile
 * suite's TC009.
 */
test('TC009 - Verify only a Professor can edit a Buzz', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const buzzPage = new BuzzPage(page);
  const marker = `Buzz-TC009 edit-me ${Date.now()}`;
  await buzzPage.openCreateBuzz();
  await buzzPage.composeAndPublish(marker);

  const card = buzzPage.cardByText(marker);
  await expect(card).toBeVisible({ timeout: 10000 });

  await buzzPage.cardMenuTrigger(card).click();
  await buzzPage.menuItem('Edit').click();
  await buzzPage.wizard().getByText('Edit Buzz').waitFor({ state: 'visible' });

  const editedMarker = `${marker} EDITED`;
  await buzzPage.composerEditor().click();
  await buzzPage.composerEditor().press('End');
  await buzzPage.composerEditor().pressSequentially(' EDITED');
  await buzzPage.wizardNextButton().click();
  await buzzPage.wizard().getByText('Select Recipients').waitFor({ state: 'visible' });
  await buzzPage.wizardNextButton().click();
  await buzzPage.wizard().getByText('Choose Buzz Board').waitFor({ state: 'visible' });
  await buzzPage.wizardSaveButton().click();
  await buzzPage.wizard().waitFor({ state: 'hidden', timeout: 15000 });

  await expect(buzzPage.cardByText(editedMarker)).toBeVisible({ timeout: 10000 });
});
