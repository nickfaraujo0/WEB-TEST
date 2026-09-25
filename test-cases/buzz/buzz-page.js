// @ts-check

// Relative, so it follows the environment picked on the dashboard (Playwright's baseURL).
export const BUZZ_URL = '/Buzz';

/**
 * Page object for the Buzz feed and its "Create Buzz" composer wizard.
 *
 * Buzz is the default screen after login (confirmed live 2026-09-14 — the same redirect the
 * Login/Opportunities suites already assert on) so most tests reach it straight off
 * `LoginPage.login()` rather than calling `goto()`.
 *
 * The composer is a stock Quill.js ("snow" theme) rich-text editor, confirmed live: both the
 * feed's rendered post bodies and the composer field carry `.ql-editor`, and the toolbar is
 * the unmodified `.ql-toolbar.ql-snow` with `.ql-bold` / `.ql-italic` / `.ql-underline` /
 * `.ql-link` / `.ql-list` buttons — Quill's own class names, not app-custom ones, so they're
 * trustworthy selectors rather than a guess.
 *
 * The card "..." overflow menu reuses the exact same antd Dropdown component/class combo as
 * `OpportunityPage.cardMenuTriggers()` (`.ant-dropdown-trigger.aspect-square`), and the Share
 * popover is the identical Email/WhatsApp/Facebook/Copy Link component too — both confirmed
 * live on Buzz, not assumed from the Opportunities suite alone.
 */
export class BuzzPage {
  constructor(page) {
    this.page = page;
    this.createBuzzButton = page.getByText('Create Buzz', { exact: true });
    this.allTab = page.getByRole('tab', { name: 'All', exact: true });

    /**
     * Each feed post's outer card. `.infinite-scroll-component` (react-infinite-scroll-
     * component) holds one `div.shadow-lg` per post as a direct child — confirmed live via
     * the rendered DOM, not the accessibility tree, since these cards carry no ARIA role or
     * accessible name of their own.
     */
    this.cards = page.locator('.infinite-scroll-component > div.shadow-lg');
  }

  async goto() {
    await this.page.goto(BUZZ_URL, { waitUntil: 'domcontentloaded' });
  }

  async openCreateBuzz() {
    await this.createBuzzButton.click();
  }

  boardTab(name) {
    return this.page.getByRole('tab', { name, exact: true });
  }

  /** The composer wizard (antd Modal, a real `role="dialog"`), whichever of its 4 steps is showing. */
  wizard() {
    return this.page.getByRole('dialog');
  }

  wizardStepLabel() {
    return this.wizard().getByText(/^Step \d \/ 4$/);
  }

  composerEditor() {
    return this.wizard().locator('.ql-editor');
  }

  /** name: 'bold' | 'italic' | 'underline' | 'link' */
  composerToolbarButton(name) {
    return this.wizard().locator(`.ql-toolbar button.ql-${name}`);
  }

  /**
   * The two attachment triggers in the composer footer, image first then file — confirmed
   * live: both are unlabelled `div.cursor-pointer` icons with no class of their own beyond
   * that, sharing one flex row, in this left-to-right order. Neither is backed by a
   * `<input type="file">` already in the DOM (confirmed by querying it directly — there is
   * none until one of these is clicked), so tests must pair the click with
   * `page.waitForEvent('filechooser')` rather than calling `setInputFiles` on a locator.
   */
  attachTriggers() {
    return this.wizard().locator('div.flex.items-center.space-x-6.justify-start > div');
  }

  attachImageTrigger() {
    return this.attachTriggers().nth(0);
  }

  attachFileTrigger() {
    return this.attachTriggers().nth(1);
  }

  wizardNextButton() {
    return this.wizard().getByRole('button', { name: 'Next' });
  }

  wizardBackButton() {
    return this.wizard().getByRole('button', { name: 'Back' });
  }

  wizardPublishButton() {
    return this.wizard().getByRole('button', { name: 'Publish' });
  }

  /** Step 3's submit button in Edit mode — confirmed live: labelled "Save" there, not
   * "Publish", even though every other label and control on the step is identical. */
  wizardSaveButton() {
    return this.wizard().getByRole('button', { name: 'Save' });
  }

  wizardCloseButton() {
    return this.wizard().getByRole('img', { name: 'close-circle' });
  }

  /** Step 2 "Select Recipients" — the "User type" pills: Everyone / Student / Professor. */
  recipientTypePill(name) {
    return this.wizard().getByText(name, { exact: true });
  }

  /**
   * The "..." menu on a specific card — only rendered for a card the signed-in account owns
   * (confirmed live: another author's card shows a board tag or nothing in that corner
   * instead). Scope `card` to one row from `.cards` first.
   */
  cardMenuTrigger(card) {
    return card.locator('.ant-dropdown-trigger.aspect-square:visible');
  }

  menuItem(name) {
    return this.page.getByRole('menuitem', { name, exact: true });
  }

  /**
   * Finds the card whose body contains the given marker text. A freshly published post is
   * not guaranteed to be first in the feed — the mobile build surfaces a "New Buzz available"
   * banner rather than inserting it in place, and this suite has not independently confirmed
   * the web feed always does either — so tests locate by marker text after a reload instead
   * of assuming feed order.
   */
  cardByText(text) {
    return this.cards.filter({ hasText: text });
  }

  /** The like / comment / share icon row. Confirmed live: `.reactions` holds exactly 3
   * children in that left-to-right order, each wrapping one icon; positional index is the
   * only handle since none carries text, an aria-label, or a distinguishing class. */
  reactionsRow(card) {
    return card.locator('.reactions');
  }

  likeIcon(card) {
    return this.reactionsRow(card).locator('> *').nth(0);
  }

  commentIcon(card) {
    return this.reactionsRow(card).locator('> *').nth(1);
  }

  shareIcon(card) {
    return this.reactionsRow(card).locator('> *').nth(2);
  }

  /** The Share popover (Email / WhatsApp / Facebook / Copy Link) — same component Opportunities uses. */
  shareDialog() {
    return this.page.getByRole('dialog').filter({ hasText: 'Share' });
  }

  /**
   * Fills step 1 with `text`, advances through Recipients and Board with their defaults
   * (Everyone / no board), and publishes.
   *
   * Confirmed live: publishing shows a brief "Step 4 / 4 — Posting Buzz" loading state, then
   * the modal closes itself and the new post appears immediately at the top of the feed — no
   * "New Buzz available" banner and no reload needed, unlike the mobile build.
   */
  async composeAndPublish(text) {
    await this.composerEditor().click();
    await this.composerEditor().pressSequentially(text);
    await this.wizardNextButton().click();
    await this.wizard().getByText('Select Recipients').waitFor({ state: 'visible' });

    await this.wizardNextButton().click();
    await this.wizard().getByText('Choose Buzz Board').waitFor({ state: 'visible' });

    await this.wizardPublishButton().click();
    await this.wizard().waitFor({ state: 'hidden', timeout: 15000 });
  }

  /**
   * Deletes `card` via its "..." menu. Confirmed live: a confirmation dialog names the exact
   * post text being removed ("Are you sure you want to delete this Buzz?") before it's final.
   */
  async deleteCard(card) {
    await this.cardMenuTrigger(card).click();
    await this.menuItem('Delete').click();

    const confirmDialog = this.page
      .getByRole('dialog')
      .filter({ hasText: 'Are you sure you want to delete this Buzz?' });
    await confirmDialog.getByRole('button', { name: 'Delete', exact: true }).click();
  }
}
