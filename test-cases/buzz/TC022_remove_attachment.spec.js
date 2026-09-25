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
 * Hive Test Cases.xlsx, sheet "Buzz", TC022 — Verify that the user is able to remove an
 * attached image/file on "Create a buzz" page.
 * Precondition: a file already attached.
 * Steps: 1. Attach a file. 2. Remove it. 3. Check it's no longer attached.
 * Expected result: not specified — inferred: the attachment chip disappears from the
 * composer.
 *
 * Tested via the file/PDF attach flow (TC019 found image attachment doesn't work at all).
 * Confirmed live: "Attach Files" is a sub-view swapped into the same Create Buzz modal, not
 * a separate stacked dialog — clicking Upload reverts to the normal Step 1 view, now showing
 * the file as a dashed-border chip with a small red circular remove icon in its corner. The
 * server also renames the file (hyphens -> underscores). Real finding, confirmed live: right
 * after Upload the composer briefly (and repeatedly, not just once) renders 2 dashed chips
 * at once — an optimistic pre-rename one and the confirmed post-rename one. Assertions below
 * target .last() (the final chip) rather than waiting for a stable count, to avoid flaking
 * on that instability.
 */
test('TC022 - Verify a removed file attachment no longer appears in the composer', async ({ page }) => {
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
});
