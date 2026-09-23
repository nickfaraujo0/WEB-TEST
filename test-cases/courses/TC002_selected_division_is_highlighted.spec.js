// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/** Confirmed live: the active division's pill carries `bg-[#3F4045]` (dark), others don't. */
test('TC002 - Verify the currently selected division tab is visually highlighted', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  expect(await courses.isDivisionActive(DSA.division)).toBe(true);
  expect(await courses.isDivisionActive('Assessment test')).toBe(false);
});
