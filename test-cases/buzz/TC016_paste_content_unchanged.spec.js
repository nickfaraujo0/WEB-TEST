// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAsProfessor } from './session.js';
import { BuzzPage, pasteText } from './buzz-feed-page.js';

/**
 * Hive Test Cases.xlsx, sheet "Buzz", TC016 — Verify that the pasted content remains
 * unchanged after pasting it on "Create a buzz" page.
 * Precondition: on Create Buzz page, some content copied.
 * Steps: 1. Paste the copied content. 2. Check if the content is displayed as it is.
 * Expected result: not specified — inferred: the pasted text matches the copied source
 * exactly, character for character (no reformatting, truncation, or whitespace changes).
 */
test('TC016 - Verify pasted content is not altered from the copied source', async ({ page }) => {
  await loginAsProfessor(page);

  const buzzPage = new BuzzPage(page);
  await buzzPage.createBuzzButton.click();

  const sourceText = `QA paste-fidelity probe: MiXeD case, punctuation!? & spacing   preserved ${Date.now()}`;

  const editor = page.locator('.ql-editor[contenteditable="true"]');
  await editor.click();
  // Real keyboard copy/paste via a temporary textarea — clipboard permissions are Chromium-only.
  await pasteText(editor, sourceText);

  // Exact equality, not just "contains" — catches silent reformatting/whitespace collapse.
  await expect(editor).toHaveText(sourceText);
});
