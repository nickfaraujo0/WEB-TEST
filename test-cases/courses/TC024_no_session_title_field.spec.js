// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

/** Web-only confirmed gap, matching the mobile suite's confirmed "designed to fail on
 * purpose" finding: there is no title field anywhere in New Session, so every session is
 * permanently "Untitled session". */
test('TC024 - Verify New Session has no field to give a session a custom title (gap)', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.addSessionButton.click();

  const dialog = courses.newSessionDialog();
  await expect(dialog.getByText('Title', { exact: false })).toHaveCount(0);
  await expect(dialog.getByPlaceholder(/title/i)).toHaveCount(0);
});
