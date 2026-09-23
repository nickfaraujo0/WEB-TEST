// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/**
 * Creates its own disposable session (rather than using `withDisposableSession`, which
 * would try to delete it a second time) to verify Delete actually removes the card.
 *
 * Confirmed live by a real run: the card's own DOM `id` can start with a digit (e.g.
 * "49G8H8..."), which makes a bare `#${id}` CSS id-selector invalid (id-selectors can't start
 * with a digit) — Playwright then throws instead of matching anything. The attribute-selector
 * form (`[id="..."]`) has no such restriction.
 */
test('TC040 - Verify confirming Delete Session removes the session from the calendar', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);

  await courses.addSessionButton.click();
  await courses.createSessionButton().click();
  const conflictDialog = page.getByRole('dialog').filter({ hasText: 'Conflict Detected' });
  const closed = await courses
    .newSessionDialog()
    .waitFor({ state: 'hidden', timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  if (!closed) {
    if (await conflictDialog.isVisible().catch(() => false)) {
      await conflictDialog.getByRole('button', { name: 'Cancel' }).click();
      await page.keyboard.press('Escape').catch(() => {});
    }
    throw new Error(
      'The default "now" slot conflicts with an existing session — clean up the conflicting session by hand and rerun.',
    );
  }

  const card = courses.cardByText('NOW').first();
  await expect(card).toBeVisible({ timeout: 15000 });
  const id = await card.getAttribute('id');

  await courses.cardMenuTrigger(card).click();
  await courses.menuItem('Delete Session').click();
  await courses.deleteConfirmButton().click();

  await expect(page.locator(`[id="${id}"]`)).toHaveCount(0, { timeout: 15000 });
});
