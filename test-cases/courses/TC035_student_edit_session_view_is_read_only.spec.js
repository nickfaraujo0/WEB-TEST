// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, STUDENT } from './courses-helpers.js';

/** Confirmed live: every field (Session Type, Participants, Unit) on the student's copy of
 * this page carries the real `disabled` attribute, and there is no Save button at all. */
test('TC035 - Verify the student\'s Session Details view is fully read-only with no Save button', async ({ page }) => {
  await loginAs(page, ...STUDENT);
  await page.getByText('Courses', { exact: true }).click();
  await page.getByText('Div A', { exact: true }).click();
  await expect(page.getByText('Schedule/Lesson Plan', { exact: true })).toBeVisible({ timeout: 20000 });
  await page.getByText('Untitled session', { exact: true }).first().click();

  await expect(page.getByText('Session Details', { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Practical' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'B1' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Save Changes' })).toHaveCount(0);
});
