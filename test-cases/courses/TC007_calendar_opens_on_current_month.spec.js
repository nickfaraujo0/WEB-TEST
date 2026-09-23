// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/** The month label is a real form control (`textbox "Select month"`), so its text lives in
 * the element's `value` — confirmed live via a real run's accessibility snapshot — not as a
 * plain text node `getByText` can match. Checked with `toHaveValue` instead. */
test('TC007 - Verify the Schedule calendar opens on the current month by default', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short' });
  await expect(page.getByRole('textbox', { name: 'Select month' })).toHaveValue(`${month}, ${now.getFullYear()}`);
});
