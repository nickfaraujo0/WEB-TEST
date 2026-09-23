// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, openCourse, DSA } from './courses-helpers.js';

test('TC021 - Verify Topics Covered has a Bold/Italic/Underline/Link/list rich-text toolbar', async ({ page }) => {
  await loginAs(page);
  const courses = await openCourse(page, DSA.course, DSA.division);
  await courses.addSessionButton.click();

  const dialog = courses.newSessionDialog();
  await expect(dialog.locator('.ql-toolbar .ql-bold')).toBeVisible();
  await expect(dialog.locator('.ql-toolbar .ql-italic')).toBeVisible();
  await expect(dialog.locator('.ql-toolbar .ql-underline')).toBeVisible();
  await expect(dialog.locator('.ql-toolbar .ql-link')).toBeVisible();
  await expect(dialog.locator('.ql-toolbar .ql-list')).toHaveCount(2);
});
