// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/** Confirmed bug live: reopening Edit Session always shows every Course Outcome checkbox
 * unchecked, regardless of what was previously saved. */
test('TC029 - Verify Edit Session does not prefill Course Outcomes (bug)', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);
  const card = courses.cardByText('George Fernandes').filter({ hasText: 'Practical' }).first();

  await courses.cardMenuTrigger(card).click();
  await courses.menuItem('Edit Session').click();
  await expect(courses.sessionDetailsHeading()).toBeVisible({ timeout: 15000 });
  await page.getByText('Course Outcomes', { exact: true }).scrollIntoViewIfNeeded();

  await expect(courses.courseOutcomeOption('ME101.1')).not.toBeChecked();
});
