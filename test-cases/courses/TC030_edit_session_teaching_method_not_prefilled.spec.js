// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

/** New section confirmed live below Course Outcomes: Teaching/Learning Method (Chalk & Talk,
 * PPT, Tutorial, Demonstration, ICT, Group Discussion) — also never prefilled on reopen. */
test('TC030 - Verify Edit Session has a Teaching/Learning Method checklist, never prefilled (bug)', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);
  const card = courses.cardByText('George Fernandes').filter({ hasText: 'Practical' }).first();

  await courses.cardMenuTrigger(card).click();
  await courses.menuItem('Edit Session').click();
  await expect(courses.sessionDetailsHeading()).toBeVisible({ timeout: 15000 });
  await page.getByText('Teaching/Learning Method', { exact: true }).scrollIntoViewIfNeeded();

  await expect(page.getByText('Chalk & Talk (TLM1)', { exact: true })).toBeVisible();
  await expect(courses.teachingMethodOption('Chalk & Talk (TLM1)')).not.toBeChecked();
});
