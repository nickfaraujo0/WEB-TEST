// @ts-check
import { expect } from '../_hive-live.mjs';
import { LoginPage } from '../login/login-page.js';
import { credential } from '../login/credentials.js';
import { BuzzPage } from '../buzz/buzz-page.js';

/** Log in with the named credentials (default: the professor account) and wait for Buzz. */
export async function loginAs(page, emailKey = 'HIVE_VALID_EMAIL', passwordKey = 'HIVE_VALID_PASSWORD') {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credential(emailKey), credential(passwordKey));
  await expect(page).toHaveURL(/\/Buzz/i, { timeout: 15000 });
}

export const STUDENT = ['HIVE_STUDENT_EMAIL', 'HIVE_STUDENT_PASSWORD'];

/** A second, signed-in browser context — for checks that need to see another user's view. */
export async function openAs(browser, keys) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginAs(page, ...keys);
  return { context, page };
}

/**
 * One Buzz post plus the like / comment / reply controls under it, as confirmed live:
 *  - The like / comment / share icons live in `.reactions` and carry no role or label.
 *  - The comment box is a textarea ("Leave a comment"); replies use a second one ("Reply to
 *    comment"). Neither has a Send button by name — the green arrow is the last svg beside it,
 *    and Enter only adds a new line.
 *  - Posting a comment shows it at once, dimmed (`.cursor-progress`) until the `createComment`
 *    cloud function returns, which takes several seconds.
 *  - Each comment is a `div.py-2`; replies nest inside their parent's `div.py-2`.
 */
export class QaPost {
  constructor(page, marker) {
    this.page = page;
    this.marker = marker;
    this.buzz = new BuzzPage(page);
  }

  get card() {
    return this.buzz.cardByText(this.marker).first();
  }
  get likeIcon() {
    return this.buzz.likeIcon(this.card);
  }
  get commentIcon() {
    return this.buzz.commentIcon(this.card);
  }
  get commentBox() {
    return this.card.locator('textarea[placeholder="Leave a comment"]');
  }
  get replyBox() {
    return this.card.locator('textarea[placeholder="Reply to comment"]');
  }
  get pending() {
    return this.card.locator('.cursor-progress');
  }
  get countLabel() {
    return this.card.getByText(/^\d+ comments?$/);
  }
  get popups() {
    return this.page.locator('.ant-popover:visible, .ant-tooltip:visible');
  }

  sendButton(box) {
    return box.locator('xpath=ancestor::div[2]').locator('svg').last();
  }
  emojiButton(box) {
    return box.locator('xpath=ancestor::div[2]').locator('svg').first();
  }
  /**
   * The comment (or reply) whose text contains `text` — the innermost match. The text bubble is
   * also a `div.py-2` (it has `px-4` too), so it is excluded to land on the whole comment with
   * its Like / Reply row.
   */
  item(text) {
    return this.card.locator('div.py-2:not([class*="px-"])').filter({ hasText: text }).last();
  }

  async openComments() {
    if (!(await this.commentBox.isVisible())) await this.commentIcon.click();
    await expect(this.commentBox).toBeVisible();
  }

  async waitSaved() {
    await expect(this.pending).toHaveCount(0, { timeout: 60000 });
  }

  async postComment(text) {
    await this.commentBox.fill(text);
    await this.sendButton(this.commentBox).click();
    await expect(this.card.getByText(text, { exact: true })).toBeVisible();
    await this.waitSaved();
  }

  async postReply(parentText, text) {
    if (!(await this.replyBox.count())) await this.item(parentText).getByText('Reply', { exact: true }).first().click();
    await expect(this.replyBox).toBeVisible();
    await this.replyBox.fill(text);
    await this.sendButton(this.replyBox).click();
    await expect(this.card.getByText(text, { exact: true })).toBeVisible();
    await this.waitSaved();
  }

  async reload() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await expect(this.card).toBeVisible({ timeout: 20000 });
  }

  /**
   * Deletes the post (and with it every like and comment on it). Never throws. After a reload
   * the feed renders a moment later, so it waits for the first card before looking for the
   * post (otherwise it would see nothing and skip the delete), and it waits for the
   * `deleteAnnouncement` request to succeed rather than trusting the card vanishing — the feed
   * briefly empties itself while it refreshes.
   */
  async remove() {
    try {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.buzz.cards.first().waitFor({ timeout: 25000 });
      if (!(await this.card.count())) return;
      const deleted = this.page.waitForResponse((r) => r.url().includes('deleteAnnouncement'), { timeout: 20000 });
      await this.buzz.deleteCard(this.card);
      const response = await deleted;
      if (!response.ok()) throw new Error('deleteAnnouncement returned ' + response.status());
    } catch (e) {
      console.warn(`QA post cleanup failed (${e.message.split('\n')[0]}), delete it by hand: "${this.marker}"`);
    }
  }
}

/** Creates a fresh QA Buzz, runs `run(post)`, then always deletes the post. */
export async function withQaPost(page, label, run) {
  const buzz = new BuzzPage(page);
  const marker = `QA ${label} ${Date.now()} (safe to delete)`;
  await buzz.openCreateBuzz();
  await buzz.composeAndPublish(marker);
  const post = new QaPost(page, marker);
  await expect(post.card).toBeVisible({ timeout: 15000 });
  try {
    await run(post);
  } finally {
    await post.remove();
  }
}
