// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

test('TC020 - Verify Select Unit pills start unselected and can be toggled', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.addSessionButton.click();

  await expect(courses.unitPill('Unit 1')).not.toHaveClass(/bg-subtleBlue/);
  await courses.unitPill('Unit 1').click();
  await expect(courses.unitPill('Unit 1')).toHaveClass(/bg-subtleBlue/);
  await expect(courses.unitPill('Unit 2')).not.toHaveClass(/bg-subtleBlue/);
});
