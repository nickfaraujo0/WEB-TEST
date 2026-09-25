// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage } from './buzz-feed-page.js';
import { CreateBuzzPage } from './create-buzz-page.js';

/**
 * TC053 — Verify rich-text formatting is kept on the published Buzz. Web-only; not in the sheet.
 * TC017 proves the toolbar formats text inside the composer; this checks the formatting survives
 * publishing and renders on the feed card (post bodies render through Quill's `.ql-editor` too).
 * Publishes one marker post and deletes it afterwards.
 */
test('TC053 - Verify bold and italic formatting persist on the published Buzz', async ({ page }) => {
  test.setTimeout(120000);
  await loginAsProfessor(page);
  const buzz = new BuzzPage(page);
  const marker = `QA Test TC053 formatting ${Date.now()} (safe to delete)`;

  await buzz.createBuzzButton.click();
  const create = new CreateBuzzPage(page);
  await create.textEditor.click();
  await create.boldButton.click();
  await create.textEditor.pressSequentially('BoldPart ');
  await create.boldButton.click();
  await create.italicButton.click();
  await create.textEditor.pressSequentially('ItalicPart ');
  await create.italicButton.click();
  await create.textEditor.pressSequentially(marker);
  try {
    await create.publishWithDefaults();
    const card = buzz.cardByText(marker).first();
    await expect(card).toBeVisible({ timeout: 15000 });
    await expect(card.locator('strong')).toHaveText(/BoldPart/);
    await expect(card.locator('em')).toHaveText(/ItalicPart/);

    await page.reload();
    await expect(buzz.cardByText(marker).first().locator('strong')).toHaveText(/BoldPart/, { timeout: 15000 });
  } finally {
    await buzz.cleanupPost(marker);
  }
});
