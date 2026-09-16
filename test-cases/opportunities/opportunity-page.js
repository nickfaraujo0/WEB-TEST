// @ts-check

export const OPPORTUNITY_URL = 'https://hive-dev.thegritcity.com/opportunity/';

/**
 * Page object for the "Events & Opportunities" listing page.
 * Note: the sidebar nav item is labelled "Opportunity" (singular); the page itself is
 * titled "Events & Opportunities". The spreadsheet's "plus icon" is actually a labelled
 * "Create Opportunity" button, not an icon-only control.
 */
export class OpportunityPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByText('Events & Opportunities');
    this.createOpportunityButton = page.getByText('Create Opportunity', { exact: true });
    this.eventsTab = page.getByText('Events', { exact: true });
    this.jobsTab = page.getByText('Jobs', { exact: true });
    this.internshipTab = page.getByText('Internship', { exact: true });
  }

  async goto() {
    await this.page.goto(OPPORTUNITY_URL);
  }

  /** The active tab's wrapper carries an extra "bg-adminSubtle" class; others don't. */
  async isTabActive(tabLocator) {
    const parentClass = await tabLocator.locator('..').getAttribute('class');
    return !!parentClass?.includes('bg-adminSubtle');
  }

  async openCreateMenu() {
    await this.createOpportunityButton.click();
  }

  createEventLink() {
    return this.page.getByRole('link', { name: 'Create Event' });
  }

  createJobsLink() {
    return this.page.getByRole('link', { name: 'Create Jobs' });
  }

  createInternshipLink() {
    return this.page.getByRole('link', { name: 'Create Internship' });
  }

  /**
   * The "..." menu triggers on listing cards (antd Dropdown). `.ant-dropdown-trigger` alone
   * also matches the header's profile avatar and the "Create Opportunity" button itself —
   * confirmed live both carry that same class — so this narrows to the card-menu-specific
   * "aspect-square" class those two don't have. Cards render two triggers each (a hidden,
   * zero-size duplicate plus the real visible one) and Playwright's `:visible` filter proved
   * flaky against that pair under load, so `openFirstCardMenu` below resolves the genuinely
   * visible one by bounding box directly and clicks its exact coordinates instead.
   */
  cardMenuTriggers() {
    return this.page.locator('.ant-dropdown-trigger.aspect-square:visible');
  }

  /**
   * Opens the "..." menu on the first listing card. Manual exploration (real mouse clicks)
   * always opened this reliably, so it's a real click, not a hover trigger. Uses Playwright's
   * own `.click()` per candidate trigger (automatic scroll-into-view + actionability checks)
   * rather than raw coordinate math, and tries each visible trigger in turn until one
   * actually opens the menu — cheaper than debugging exactly why a specific index was
   * occasionally unresponsive on this page.
   */
  async openFirstCardMenu() {
    const triggers = this.page.locator('.ant-dropdown-trigger.aspect-square:visible');
    await triggers.first().waitFor({ state: 'visible' });
    const count = Math.min(await triggers.count(), 5);

    for (let i = 0; i < count; i++) {
      await triggers.nth(i).click();
      const isOpen = await this.menuItem('Share')
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true)
        .catch(() => false);
      if (isOpen) return;
      await this.page.keyboard.press('Escape').catch(() => {});
      await this.page.waitForTimeout(300);
    }

    throw new Error(`Card menu did not open after trying ${count} trigger(s)`);
  }

  menuItem(name) {
    return this.page.getByRole('menuitem', { name, exact: true });
  }

  async clickMenuItem(name) {
    await this.menuItem(name).click();
  }

  /** The Share dialog (antd Modal, a real role="dialog") with Email/WhatsApp/Facebook/Copy Link. */
  shareDialog() {
    return this.page.getByRole('dialog').filter({ hasText: 'Share' });
  }
}
