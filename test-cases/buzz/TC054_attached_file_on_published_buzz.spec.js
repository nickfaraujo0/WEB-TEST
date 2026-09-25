// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';
import path from 'path';
import { fileURLToPath } from 'url';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

/**
 * TC054 — Verify an attached PDF appears on the published Buzz. Web-only; not in the sheet.
 * TC020–TC022 only cover attaching inside the composer; this publishes the post and checks the
 * file shows on the feed card and survives a reload. Confirmed live (2026-09-25): the card shows
 * the name with the hyphen dropped ("smalltest.pdf"), while the composer chip shows "small_test.pdf";
 * the card entry is not a link, so opening/downloading it from the feed is not asserted here.
 * Publishes one marker post and deletes it afterwards.
 */
test('TC054 - Verify an attached PDF shows on the published Buzz', async ({ page }) => {
  test.setTimeout(120000);
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  const marker = `QA Test TC054 attachment ${Date.now()} (safe to delete)`;

  await buzz.createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.fillText(marker);
  await create.fileAttachIcon.click();
  await expect(create.attachFilesDialog).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles(path.join(fixturesDir, 'small-test.pdf'));
  await create.attachFilesUploadButton.click();
  await expect(create.attachedFileChip.last()).toContainText('small_test.pdf', { timeout: 10000 });
  try {
    await create.publishWithDefaults();
    const card = buzz.cardByText(marker).first();
    await expect(card).toBeVisible({ timeout: 15000 });
    await expect(card.getByText(/small_?test\.pdf/)).toBeVisible();

    await page.reload();
    await expect(buzz.cardByText(marker).first().getByText(/small_?test\.pdf/)).toBeVisible({ timeout: 15000 });
  } finally {
    await buzz.cleanupPost(marker);
  }
});
