// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from '../_session.mjs';
import { openCourseTabs, DSA_ASSESSMENT, qaPdf } from './course-tabs-page.js';
import { withLock } from '../_lock.mjs';

// The course list alone can take up to 60s to load on hive-dev.
test.describe.configure({ timeout: 180000 });

/**
 * Hive Test Cases Playwright (master), sheet "Courses – List & Course Tabs (Web)", TC087 —
 * Verify a file over 10 MB is rejected with a size-limit error.
 *
 * Confirmed live 2026-09-29: an 11 MB file is refused with a "Some files were not uploaded" dialog
 * ("…larger than 10MB and were not uploaded"). Expects that and no new row; if the app accepts it anyway, the test
 * deletes the file and fails.
 */
test('TC087 - Verify a file over 10 MB is rejected with a size-limit error', async ({ page }) => {
  await loginAsProfessor(page);
  const tabs = await openCourseTabs(page, DSA_ASSESSMENT.course, DSA_ASSESSMENT.division);
  await tabs.openSubTab('Resources');
  await expect(tabs.uploadLocalButton()).toBeVisible({ timeout: 20000 });
  await withLock('courses-resources', async () => {
    const big = qaPdf(11 * 1024 * 1024);
    await tabs.uploadFile(big);
    const rejected = page.getByRole('dialog', { name: 'Some files were not uploaded' });
    await expect(rejected).toBeVisible({ timeout: 15000 });
    await expect(rejected).toContainText('larger than 10MB and were not uploaded');
    await expect(rejected).toContainText(big.name);
    await rejected.getByRole('button', { name: 'OK' }).click();
    await expect(rejected).toBeHidden();
    await page.waitForTimeout(3000);
    try {
      await expect(tabs.resourceName(big.name)).toHaveCount(0);
    } finally {
      if (await tabs.resourceName(big.name).count()) await tabs.deleteResource(big.name);
    }
  });
});
