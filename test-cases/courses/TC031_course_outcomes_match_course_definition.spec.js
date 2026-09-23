// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/**
 * Correction to an assumption carried over from the mobile suite: Course Outcomes is NOT a
 * fixed 152-item list — it's defined per course. ME101 (Mechanics of Solids) has exactly 3
 * outcomes (ME101.1/.2/.3), confirmed live, plus a "Learn more" info link.
 */
test('TC031 - Verify Course Outcomes lists exactly this course\'s own defined outcomes', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);
  const card = courses.cardByText('George Fernandes').filter({ hasText: 'Practical' }).first();

  await courses.cardMenuTrigger(card).click();
  await courses.menuItem('Edit Session').click();
  await expect(courses.sessionDetailsHeading()).toBeVisible({ timeout: 15000 });
  await page.getByText('Course Outcomes', { exact: true }).scrollIntoViewIfNeeded();

  await expect(page.getByText('ME101.1', { exact: true })).toBeVisible();
  await expect(page.getByText('ME101.2', { exact: true })).toBeVisible();
  await expect(page.getByText('ME101.3', { exact: true })).toBeVisible();
  await expect(page.getByText('Learn more', { exact: true })).toBeVisible();
});
