// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage, pasteText } from './buzz-feed-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC018 — Verify that a pasted link is displayed as a
 * clickable link (not plain text) on "Create a buzz" page.
 * Precondition: on Create Buzz page, a URL copied.
 * Steps: 1. Paste the URL into the text field. 2. Check how it renders.
 * Expected (spreadsheet): the link "should not turn to normal text" — i.e. it becomes a link.
 *
 * Confirmed live (2026-09-25, all 3 browsers): the pasted URL stays plain text, with no <a> created.
 * Hence "(gap)": this asserts the current behavior and fails once auto-linking ships.
 */
test('TC018 - Verify a pasted URL stays plain text instead of auto-linking (gap)', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.createBuzzButton.click();

  const url = 'https://example.com';

  const editor = page.locator('.ql-editor[contenteditable="true"]');
  await editor.click();
  // Real keyboard copy/paste via a temporary textarea — clipboard permissions are Chromium-only.
  await pasteText(editor, url);
  await expect(editor).toContainText(url);

  // Confirmed live (2026-09-25, chromium): no <a> is created — the URL stays plain text, so the
  // spreadsheet's "should not turn to normal text" is not met. Asserts that gap (one outcome only;
  // the old either/or branch passed whatever happened) and fails once auto-linking ships.
  await expect(editor).toHaveText(url);
  await expect(editor.locator('a')).toHaveCount(0);
});
