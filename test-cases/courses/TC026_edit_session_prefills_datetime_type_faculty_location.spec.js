// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/** Schedule Date and Session Start Time are real form controls (`textbox`), so their prefilled
 * value lives in `value`, not as page text — confirmed live the same way TC007/TC017 were. */
test('TC026 - Verify Edit Session prefills Date/Time/Duration/Type/Faculty from the saved session', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);
  const card = courses.cardByText('George Fernandes').filter({ hasText: 'Practical' }).first();

  await courses.cardMenuTrigger(card).click();
  await courses.menuItem('Edit Session').click();
  await expect(courses.sessionDetailsHeading()).toBeVisible({ timeout: 15000 });

  await expect(page.getByRole('textbox', { name: 'Select date' })).toHaveValue('02 September 2026');
  await expect(page.getByRole('textbox', { name: 'Select time' })).toHaveValue('11:00 AM');
  await expect(courses.sessionTypeField('Practical')).toHaveClass(/bg-subtleBlue/);
  await expect(page.getByText('George Fernandes', { exact: true })).toBeVisible();
});
