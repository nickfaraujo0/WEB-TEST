// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/**
 * Confirmed live: Duration defaults to "1h" (not 2h as the mobile suite assumes), Session
 * Type defaults to "Lecture" selected, and Batches defaults to "All" selected — none of the
 * three start empty.
 *
 * Session Date and Duration are real form controls (`textbox`/`spinbutton`), so their default
 * value lives in the element's `value`, not as page text — a real run proved `getByText`
 * against them always times out with "element(s) not found" even though the value is right
 * there in the accessibility snapshot. Checked via `toHaveValue` instead.
 */
test('TC017 - Verify New Session defaults: today\'s date, Duration 1h, Lecture, Batches All', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.addSessionButton.click();

  const dialog = courses.newSessionDialog();
  await expect(dialog).toBeVisible();
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  await expect(dialog.getByRole('textbox', { name: 'Select date' })).toHaveValue(today);
  await expect(dialog.getByRole('spinbutton')).toHaveValue('1h');
  await expect(courses.sessionTypePill('Lecture')).toHaveClass(/bg-subtleBlue/);
  await expect(courses.batchPill('All')).toHaveClass(/bg-subtleBlue/);
});
