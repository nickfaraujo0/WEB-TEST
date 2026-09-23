// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/** Confirmed bug live: even after a session's Unit was previously saved, reopening Edit
 * Session shows every Unit radio unselected. Unit renders as a native radio group
 * (confirmed live: clicking one shows the standard filled-circle radio state), so this
 * checks the accessible checked state directly rather than guessing a CSS class. */
test('TC028 - Verify Edit Session does not prefill the previously saved Unit (bug)', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);
  const card = courses.cardByText('George Fernandes').filter({ hasText: 'Practical' }).first();

  await courses.cardMenuTrigger(card).click();
  await courses.menuItem('Edit Session').click();
  await expect(courses.sessionDetailsHeading()).toBeVisible({ timeout: 15000 });
  await page.getByText('Unit', { exact: true }).scrollIntoViewIfNeeded();

  for (const unit of ['Unit 1', 'Unit 2', 'Unit 3']) {
    await expect(page.getByRole('radio', { name: unit })).not.toBeChecked();
  }
});
