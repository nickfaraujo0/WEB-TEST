// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, MECHANICS_OF_SOLIDS } from './courses-helpers.js';

test('TC033 - Verify Planned Topic, Covered Topic and Remarks are separate rich-text fields', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, MECHANICS_OF_SOLIDS.course, MECHANICS_OF_SOLIDS.division);
  const card = courses.cardByText('George Fernandes').filter({ hasText: 'Practical' }).first();

  await courses.cardMenuTrigger(card).click();
  await courses.menuItem('Edit Session').click();
  await expect(courses.sessionDetailsHeading()).toBeVisible({ timeout: 15000 });

  await expect(page.locator('.ql-editor')).toHaveCount(3);
  await expect(page.getByText('Planned Topic', { exact: true })).toBeVisible();
  await expect(page.getByText('Covered Topic', { exact: true })).toBeVisible();
  await expect(page.getByText('Remarks', { exact: true })).toBeVisible();
});
