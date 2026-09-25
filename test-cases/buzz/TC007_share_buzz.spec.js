// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC007 — Verify sharing a Buzz.
 * Precondition: logged in, at least 1 post in the feed.
 * Steps: 1. Tap the share icon on a post. 2. Observe the share options.
 * Expected: a share dialog opens.
 *
 * Confirmed live: this is the identical Email/WhatsApp/Facebook/Copy Link popover
 * OpportunityPage.shareDialog() already covers — same component, reused on Buzz.
 */
test('TC007 - Verify sharing a Buzz', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  const firstCard = buzzPage.cards.first();
  await expect(firstCard).toBeVisible();
  await buzzPage.shareIcon(firstCard).click();

  const dialog = buzzPage.shareDialog();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Email')).toBeVisible();
  await expect(dialog.getByText('WhatsApp')).toBeVisible();
  await expect(dialog.getByText('Facebook')).toBeVisible();
  await expect(dialog.getByText('Copy Link')).toBeVisible();
});
