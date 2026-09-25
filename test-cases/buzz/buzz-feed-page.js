// @ts-check
import { expect } from '@playwright/test';

// Relative, so it follows the environment picked on the dashboard (Playwright's baseURL).
export const BUZZ_URL = '/Buzz';

/**
 * Page object for the Buzz feed. "Create Buzz" (top right) only renders for professors —
 * confirmed live for both roles, 2026-09-18 — students get no equivalent control at all.
 * Each post card carries a "..." menu (antd Dropdown): students see nothing (no menu exists
 * on posts they didn't author), the post's own author sees View/Edit/Delete-shaped options.
 */
export class BuzzPage {
  constructor(page) {
    this.page = page;
    this.createBuzzButton = page.getByText('Create Buzz', { exact: true });
    this.heading = page.getByRole('heading', { name: 'Buzz' }).or(page.getByText('Buzz', { exact: true })).first();
  }

  async goto() {
    await this.page.goto(BUZZ_URL, { waitUntil: 'domcontentloaded' });
  }

  /** The "..." menu triggers on post cards — same antd Dropdown pattern as Opportunities. */
  cardMenuTriggers() {
    return this.page.locator('.ant-dropdown-trigger.aspect-square:visible');
  }

  menuItem(name) {
    return this.page.getByRole('menuitem', { name, exact: true });
  }

  /**
   * Opens the "..." menu on the first post card. Tries each visible trigger in turn (a
   * lesson learned from the Opportunities suite: retrying blindly on a timeout re-clicks,
   * and therefore re-closes, a menu that was just slow to render).
   */
  async openFirstCardMenu() {
    const triggers = this.cardMenuTriggers();
    await triggers.first().waitFor({ state: 'visible' });
    const count = Math.min(await triggers.count(), 5);

    for (let i = 0; i < count; i++) {
      // A previous attempt's click can open its menu after a short delay — check before
      // clicking again, or two different cards' menus end up open at once (each with its
      // own "Edit"/"Share" item, making every menuItem() lookup ambiguous).
      const alreadyOpen = await this.page.getByRole('menu').isVisible().catch(() => false);
      if (alreadyOpen) {
        await this.menuSettled();
        return;
      }

      await triggers.nth(i).click();
      const isOpen = await this.page
        .getByRole('menu')
        .waitFor({ state: 'visible', timeout: 1500 })
        .then(() => true)
        .catch(() => false);
      if (isOpen) {
        await this.menuSettled();
        return;
      }
      await this.page.keyboard.press('Escape').catch(() => {});
      await this.page.getByRole('menu').waitFor({ state: 'hidden', timeout: 1500 }).catch(() => {});
    }
    throw new Error(`Card menu did not open after trying ${count} trigger(s)`);
  }

  /**
   * Waits for the open dropdown to finish its open animation. Clicking a menu item mid-
   * transition can get intercepted by an overlay that hasn't finished fading (the cause of an
   * earlier flake here), so wait until antd drops its `-enter`/`-appear` motion classes rather
   * than sleeping a fixed amount.
   */
  async menuSettled() {
    const dropdown = this.page.locator('.ant-dropdown:not(.ant-dropdown-hidden)').last();
    await expect(dropdown).not.toHaveClass(/-(enter|appear)(\s|$|-)/, { timeout: 3000 }).catch(() => {});
  }

  /** Board tabs on the feed (antd Tabs) — only boards the user follows get a tab. */
  boardTab(name) {
    return this.page.getByRole('tab', { name, exact: true });
  }

  /** Post cards in the infinite-scroll feed (also used on /Buzz/Board/<id> pages). */
  feedCards() {
    return this.page.locator('.infinite-scroll-component > div');
  }

  /** The board label link (top-right of a card) — an <a href="/Buzz/Board/<id>">. */
  boardLabels() {
    return this.page.locator('a[href^="/Buzz/Board/"]');
  }

  cardByText(text) {
    return this.feedCards().filter({ hasText: text });
  }

  /**
   * Loads more of the feed (up to `maxScrolls` pages) until `locator` has a match. Leftover
   * test posts can push every post with a given trait (e.g. a board label) off the first page,
   * so tests that need one shouldn't assume it's there on load.
   */
  async loadUntilPresent(locator, maxScrolls = 8) {
    await expect(this.feedCards().first()).toBeVisible({ timeout: 15000 });
    for (let i = 0; i < maxScrolls && (await locator.count()) === 0; i++) {
      await this.scrollFeedToBottom(1);
    }
    await expect(locator.first()).toBeAttached({ timeout: 5000 });
  }

  /**
   * Scrolls the feed's own scroll container to the bottom up to `times` times, waiting after
   * each scroll for more cards to load. Stops early once a scroll loads nothing new (end of
   * the list), instead of sleeping a fixed time per round.
   */
  async scrollFeedToBottom(times = 4) {
    const cards = this.feedCards();
    for (let i = 0; i < times; i++) {
      const before = await cards.count();
      await this.page.evaluate(() => {
        // react-infinite-scroll-component listens on its nearest scrollable ancestor (or the
        // window), so scroll exactly that element.
        let el = document.querySelector('.infinite-scroll-component');
        while (el && !(el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(el).overflowY))) {
          el = el.parentElement;
        }
        if (el) el.scrollTop = el.scrollHeight;
        else window.scrollTo(0, document.body.scrollHeight);
      });
      const grew = await expect
        .poll(() => cards.count(), { timeout: 8000 })
        .toBeGreaterThan(before)
        .then(() => true, () => false);
      if (!grew) return;
    }
  }


  /**
   * Deletes the signed-in author's own post containing `text` via its own card's "..." menu —
   * scoped to that card, so another of the author's posts can never be deleted by mistake.
   * Confirmed live: Delete -> "Are you sure you want to delete this Buzz?" -> Delete ->
   * "Buzz was Deleted Successfully" -> Okay.
   */
  async deletePost(text) {
    const card = this.cardByText(text).first();
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.locator('.ant-dropdown-trigger.aspect-square:visible').click();
    await this.menuSettled();
    await this.menuItem('Delete').click();
    await this.page
      .getByRole('dialog')
      .filter({ hasText: 'Are you sure you want to delete this' })
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    await this.page.getByRole('button', { name: 'Okay' }).click({ timeout: 15000 }).catch(() => {});
    await expect(this.cardByText(text)).toHaveCount(0, { timeout: 15000 });
  }

  /**
   * Best-effort cleanup for a post a test published: reloads the feed, finds the post (it may
   * have been pushed down by other runs' posts) and deletes it. Never fails the test — logs the
   * marker instead so it can be removed by hand.
   */
  async cleanupPost(text) {
    try {
      await this.goto();
      await this.loadUntilPresent(this.cardByText(text));
      await this.deletePost(text);
    } catch (e) {
      console.warn(`Cleanup: could not delete Buzz "${text}" — remove it by hand. (${e.message.split('\n')[0]})`);
    }
  }

  shareDialog() {
    return this.page.getByRole('dialog').filter({ hasText: 'Share' });
  }

  /** The like/comment/share icon row on a post — always exactly 3 children, in that order. */
  reactionsRow(nth = 0) {
    return this.page.locator('.reactions').nth(nth);
  }

  shareIcon(nth = 0) {
    // The 3 icons aren't uniformly wrapped — the first is a <div>, the other two are bare
    // <svg> children — so this must match any child element, not just <div>.
    return this.reactionsRow(nth).locator('> *').nth(2);
  }
}

/**
 * Waits until `locator`'s match count stops changing for `quietMs` — for lists that render in
 * bursts (a board's cards replacing the previous tab's, a chip briefly duplicated while the
 * upload settles), where there's no single final element to wait for.
 */
export async function waitForStableCount(locator, { quietMs = 700, timeout = 10000 } = {}) {
  const deadline = Date.now() + timeout;
  let last = await locator.count();
  let stableSince = Date.now();
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 100));
    const now = await locator.count();
    if (now !== last) {
      last = now;
      stableSince = Date.now();
    } else if (Date.now() - stableSince >= quietMs) {
      return now;
    }
  }
  return last;
}

/**
 * Pastes `text` into `editor` through the real clipboard: copies it from a throwaway textarea with
 * ControlOrMeta+C, then presses ControlOrMeta+V in the editor. No clipboard permissions needed
 * (those are Chromium-only), and the editor ignores synthetic `paste` events (checked 2026-09-25).
 */
export async function pasteText(editor, text) {
  const page = editor.page();
  await page.evaluate((t) => {
    const area = document.createElement('textarea');
    area.id = 'qa-clipboard-source';
    area.value = t;
    document.body.appendChild(area);
    area.focus();
    area.select();
  }, text);
  await page.keyboard.press('ControlOrMeta+C');
  await page.evaluate(() => document.getElementById('qa-clipboard-source')?.remove());
  await editor.click();
  await page.keyboard.press('ControlOrMeta+V');
}
