// @ts-check
import { expect } from '@playwright/test';

/**
 * Page object for the "Create Buzz" wizard (a modal, not a separate page — opened from the
 * feed's "Create Buzz" button). Step 1: text (Quill rich-text editor). Step 2: Select
 * Recipients (Everyone/Student/Professor, "Everyone" default). Step 3/4: Choose Buzz Board,
 * whose continue button is labelled "Publish" rather than "Next". "Edit Buzz" reuses this
 * exact same wizard, pre-filled with the post's existing text — confirmed live.
 */
export class CreateBuzzPage {
  constructor(page) {
    this.page = page;
    // .ql-editor also renders read-only post content in the feed cards (Quill is reused for
    // both input and display) — [contenteditable="true"] narrows to the actual input.
    this.textEditor = page.locator('.ql-editor[contenteditable="true"]');
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
    this.publishButton = page.getByRole('button', { name: 'Publish', exact: true });
    this.closeButton = page.locator('.ant-modal, [role="dialog"]').getByRole('img', { name: /close/i })
      .or(page.locator('.ant-modal-close, [aria-label="close"]'));

    // Standard Quill toolbar buttons, confirmed live via DOM inspection on Step 1.
    this.boldButton = page.locator('.ql-bold');
    this.italicButton = page.locator('.ql-italic');
    this.underlineButton = page.locator('.ql-underline');
    this.linkButton = page.locator('.ql-link');
    this.orderedListButton = page.locator('.ql-list[value="ordered"]');
    this.bulletListButton = page.locator('.ql-list[value="bullet"]');

    // Step 1 footer: exactly 2 icons.
    const attachRow = page.locator('.flex.items-center.space-x-6.justify-start');
    this.imageAttachIcon = attachRow.locator('> div').nth(0);
    this.fileAttachIcon = attachRow.locator('> div').nth(1);

    // Clicking imageAttachIcon opens its own dialog ("Click to Upload", JPG/PNG under 5MB,
    // Save Image / Change Image / Cancel) rather than going straight to a native file
    // picker — confirmed live via a real Playwright run (not just manual DOM inspection).
    this.imageUploadDialog = page.getByRole('dialog').filter({ hasText: 'Click to Upload' });
    this.imageUploadClickArea = this.imageUploadDialog.getByText('Click to Upload');
    this.saveImageButton = this.imageUploadDialog.getByRole('button', { name: 'Save Image', exact: true });
    this.changeImageButton = this.imageUploadDialog.getByRole('button', { name: 'Change Image', exact: true });

    // Clicking fileAttachIcon swaps Step 1's own view (inside the same Create Buzz modal,
    // not a separate stacked dialog) to an "Attach Files" sub-view (PDF only) — same
    // component family as the Opportunities suite's file upload. Clicking Upload reverts to
    // the normal Step 1 view, now showing the file as a single dashed-border chip below the
    // editor with a red circular remove icon. The server also renames the file, turning
    // hyphens into underscores (e.g. "small-test.pdf" -> "small_test.pdf") — confirmed live
    // via a full DOM dump, and consistent with the same renaming already documented in the
    // Opportunities suite's file upload.
    this.attachFilesDialog = page.getByText('Attach Files');
    this.attachFilesUploadButton = page.getByRole('button', { name: 'Upload', exact: true });
    this.attachedFileChip = page.locator('div.border-dashed');
    this.removeAttachedFileButton = this.attachedFileChip.locator('.text-red-600');

    // Step 2 "Select Recipients": User type pills, then toggles that vary by pill —
    // Student shows Department/Programs/Year of study, Professor shows Department only.
    // Each toggle row is an antd Collapse header (.ant-collapse-header) whose text and
    // switch are both descendants of that same header — confirmed live via DOM inspection.
    // Each pill is a real <button> — confirmed live; the selected one carries a
    // "bg-brandGreen" class, unselected ones don't.
    this.recipientTypeButton = (name) => page.getByRole('button', { name, exact: true });
    this.recipientToggle = (name) => page
      .locator('.ant-collapse-header', { hasText: name })
      .locator('button[role="switch"], .ant-switch');
  }

  /** Top-right X icon on every wizard step. */
  get closeWizardIcon() {
    return this.page.locator('.ant-modal-content svg.cursor-pointer.absolute').first();
  }

  get wizardModal() {
    return this.page.locator('.ant-modal-content').last();
  }

  /** Expanded option buttons under a recipient filter (e.g. "Department") once its toggle is on. */
  recipientOptions(header) {
    return this.page
      .locator('.ant-collapse-item', { has: this.page.locator('.ant-collapse-header', { hasText: header }) })
      .locator('.ant-collapse-content-box button');
  }

  /** Step 3 "Choose Buzz Board": each board is a clickable card containing a checkbox. */
  boardCard(name) {
    return this.wizardModal.locator('div.rounded-card').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  get boardCards() {
    return this.wizardModal.locator('div.rounded-card');
  }

  get boardCheckboxes() {
    return this.wizardModal.locator('input[type="checkbox"]');
  }

  get boardSearchInput() {
    return this.wizardModal.locator('.ant-input-affix-wrapper input');
  }

  get boardListScroller() {
    return this.wizardModal.locator('.overflow-y-auto');
  }

  async fillText(text) {
    await this.textEditor.click();
    await this.textEditor.fill(text);
  }

  /** Advances from Step 1 (text) to Step 2 (Select Recipients). */
  async goToRecipients() {
    await this.nextButton.click();
    await expect(this.page.getByText('Select Recipients')).toBeVisible();
  }

  async publishWithDefaults() {
    await this.nextButton.click(); // Step 1 -> 2 (Select Recipients)
    await this.nextButton.click(); // Step 2 -> 3 (Choose Buzz Board), defaults to "Everyone"
    await this.publishButton.click(); // Step 3 -> publish, no board selected
  }

  /** Publishes to a specific board (Step 3 card) with the default "Everyone" recipients. */
  async publishWithBoard(boardName) {
    await this.nextButton.click(); // Step 1 -> 2
    await this.nextButton.click(); // Step 2 -> 3 (Choose Buzz Board)
    await this.boardCard(boardName).click();
    await this.publishButton.click();
  }

  /** Publishes to Student recipients narrowed to specific department(s). */
  async publishToDepartments(departmentNames) {
    await this.nextButton.click(); // Step 1 -> 2
    await this.recipientTypeButton('Student').click();
    await this.recipientToggle('Department').click({ force: true });
    for (const name of departmentNames) {
      const matches = this.recipientOptions('Department').filter({ hasText: new RegExp(`^${name}$`) });
      await expect(matches.first()).toBeVisible();
      for (let i = 0; i < (await matches.count()); i++) await matches.nth(i).click();
    }
    await this.nextButton.click(); // Step 2 -> 3
    await this.publishButton.click();
  }

  /** Publishes with a specific recipient type ("Student" or "Professor") selected. */
  async publishWithRecipientType(type) {
    await this.nextButton.click(); // Step 1 -> 2 (Select Recipients)
    await this.recipientTypeButton(type).click();
    await this.nextButton.click(); // Step 2 -> 3 (Choose Buzz Board)
    await this.publishButton.click(); // Step 3 -> publish, no board selected
  }
}
