// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT } from './course-tabs-page.js';
import { withLock } from '../_lock.mjs';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC075 —
 * Verify Save Changes persists an edited Course Description after reload.
 *
 * Real write to the shared DSA-123 course: appends " [QA]" to the description, saves, reloads, checks it,
 * then always restores the original text. Serialised with a lock so parallel runs never overlap.
 */
test('TC075 - Verify Save Changes persists an edited Course Description after reload', async ({ page }) => {
  await loginAsProfessor(page);
  await withLock('courses-info', async () => {
    const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
    await tabs.courseInfoButton.click();
    const settings = tabs.courseSettings();
    await expect(settings).toBeVisible();

    const original = await tabs.descriptionInput().inputValue();
    const edited = `${original.slice(0, 240)} [QA]`;
    try {
      await tabs.descriptionInput().fill(edited);
      await tabs.settingsSaveButton().click();
      await expect(settings).toBeHidden({ timeout: 20000 });

      await page.reload();
      await tabs.courseInfoButton.click();
      await expect(tabs.descriptionInput()).toHaveValue(edited, { timeout: 20000 });
    } finally {
      if (!(await settings.isVisible().catch(() => false))) await tabs.courseInfoButton.click();
      await tabs.descriptionInput().fill(original);
      await tabs.settingsSaveButton().click();
      await expect(settings).toBeHidden({ timeout: 20000 });
    }
  });
});
