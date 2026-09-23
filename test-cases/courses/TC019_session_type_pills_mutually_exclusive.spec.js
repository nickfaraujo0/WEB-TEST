// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

test('TC019 - Verify Session Type pills in New Session are mutually exclusive', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.addSessionButton.click();

  await expect(courses.sessionTypePill('Lecture')).toHaveClass(/bg-subtleBlue/);
  await courses.sessionTypePill('Tutorial').click();
  await expect(courses.sessionTypePill('Tutorial')).toHaveClass(/bg-subtleBlue/);
  await expect(courses.sessionTypePill('Lecture')).not.toHaveClass(/bg-subtleBlue/);
});
