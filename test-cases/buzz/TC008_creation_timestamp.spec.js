// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { BuzzPage } from './buzz-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC008 — Verify the creation date/time is shown on a
 * Buzz.
 * Precondition: logged in.
 * Steps: Observe a Buzz card.
 * Expected (mobile): a relative "2h" / "3d" style label near the post.
 *
 * N/A on web (2026-09-14, confirmed live): no timestamp — relative or absolute — renders
 * anywhere on a Buzz card, and none of its elements carry a `title` or `datetime` attribute
 * either. The only dates visible in the feed are ones a post's own text happens to contain
 * (leftover markers from earlier manual runs), which is not a creation-time feature. Written
 * as a real assertion of that absence, the same way opportunities/TC020 documents its "N/A on
 * web" finding, rather than a bare skip.
 */
test('TC008 - Verify the creation date/time on a Buzz (N/A on web)', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential('HIVE_VALID_EMAIL'), credential('HIVE_VALID_PASSWORD'));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });

  const buzzPage = new BuzzPage(page);
  const firstCard = buzzPage.cards.first();
  await expect(firstCard).toBeVisible();

  const timestampLike = firstCard.getByText(/^\d{1,3}\s?(s|m|h|d|w|mo|y)$/i);
  await expect(timestampLike).toHaveCount(0);
  await expect(firstCard.locator('[title], [datetime]')).toHaveCount(0);
});
