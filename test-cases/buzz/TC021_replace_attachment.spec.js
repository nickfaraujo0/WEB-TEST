// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage, waitForStableCount } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Next to this spec, so it resolves the same whichever folder Playwright is started from.
const buzzFixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC021 — Verify that the user is able to replace an
 * attached image/file on "Create a buzz" page.
 * Precondition: a file already attached (see TC020).
 * Steps: 1. Attach a file. 2. Replace it with a different one.
 * Expected result: not specified — inferred: the new file takes the old one's place.
 *
 * Tested via the file/PDF attach flow, not image — TC019 found image attachment is
 * completely broken (selection never registers), so "replace" can't be exercised there at
 * all. The file flow has no dedicated "Replace" control either, and both footer icons become
 * disabled once a file is attached (confirmed live — only one attachment at a time is
 * allowed); the only available path is remove the existing attachment (TC022's red circular
 * icon) and attach a new one in its place, the same interaction a real user would have to use.
 *
 * Real finding, confirmed live: right after Upload, the composer briefly renders 2 dashed
 * chips at once (an optimistic pre-rename one and the confirmed post-rename one) — and this
 * isn't a one-time transitional flicker, it toggles between 1 and 2 repeatedly for a bit
 * before settling. Assertions below target .last() (the final, server-renamed chip) rather
 * than waiting for a stable count, to avoid flaking on that instability.
 */
test('TC021 - Verify a file attachment can be removed and replaced with a different one', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.createBuzzButton.click();

  const createPage = new CreateBuzzPage(page);
  await createPage.fileAttachIcon.click();
  await expect(createPage.attachFilesDialog).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(path.join(buzzFixtures, 'small-test.pdf'));
  await createPage.attachFilesUploadButton.click();

  await expect(createPage.attachedFileChip.last()).toContainText('small_test.pdf', { timeout: 10000 });
  await waitForStableCount(createPage.attachedFileChip); // the chip briefly renders twice while the upload settles
  await createPage.removeAttachedFileButton.last().click();
  await expect(createPage.attachedFileChip).toHaveCount(0, { timeout: 10000 });

  // Attach a second, differently-named PDF in its place.
  await createPage.fileAttachIcon.click();
  await expect(createPage.attachFilesDialog).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(path.join(buzzFixtures, 'small-test-2.pdf'));
  await createPage.attachFilesUploadButton.click();

  await expect(createPage.attachedFileChip.last()).toContainText('small_test', { timeout: 10000 });
  await expect(createPage.attachedFileChip.last()).toContainText('2.pdf');
});
