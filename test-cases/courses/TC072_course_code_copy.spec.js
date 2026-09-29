// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC072 —
 * Verify the copy button copies the Course Code.
 *
 * Confirmed live 2026-09-29: a "copy" button sits next to the Course Code. The clipboard write is captured
 * in the page (works the same in every browser, no clipboard permission needed).
 */
test('TC072 - Verify the copy button copies the Course Code', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.courseInfoButton.click();
  const settings = tabs.courseSettings();
  await expect(settings).toBeVisible();
  await page.evaluate(() => {
    // @ts-ignore
    window.__copied = null;
    navigator.clipboard.writeText = async (text) => {
      // @ts-ignore
      window.__copied = text;
    };
  });
  await settings.getByText('copy', { exact: true }).click();
  // @ts-ignore
  await expect.poll(() => page.evaluate(() => window.__copied)).toBe(DSA_ASSESSMENT.code);
  await tabs.modalClose('Course Settings').click();
  await expect(settings).toBeHidden();
});
