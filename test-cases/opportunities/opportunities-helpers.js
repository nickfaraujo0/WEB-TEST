// @ts-check
import { OpportunityPage } from './opportunity-page.js';

/**
 * Best-effort cleanup for opportunity-create tests that publish a real "QA Test" listing
 * (currently TC009 and TC010). Confirmed live via network capture: clicking "Preview" already
 * fires the CreateEvent endpoint — so even a run that never reaches the "Publish" button (TC009)
 * has already created a real backend record by that point; there is no side-effect-free path
 * through this form. There is also no "Delete" option on a listing card's "..." menu, only
 * "Unpublish" (confirmed live: View / Edit / Unpublish / Share) — and clicking it takes effect
 * immediately, with no confirmation dialog.
 *
 * Confirmed live: after Publish, the new card can take a few seconds — and sometimes more than
 * one fresh navigation — to appear in its tab's feed. This is an intermittent, unexplained
 * delay/race in the app itself, not something this helper works around beyond a few retries.
 * Cleanup is therefore best-effort: a lookup miss is logged via console.warn and swallowed
 * rather than failing the test, the same pattern already used for this project's other
 * post-hoc cleanup helpers (e.g. likes-comments' disposable-post cleanup).
 *
 * @param {import('@playwright/test').Page} page
 * @param {'Jobs'|'Internship'} type
 * @param {string} title exact listing title used when creating it
 */
export async function cleanupOpportunityByTitle(page, type, title) {
  try {
    const opportunityPage = new OpportunityPage(page);
    const tab = type === 'Jobs' ? opportunityPage.jobsTab : opportunityPage.internshipTab;

    let card = null;
    for (let attempt = 1; attempt <= 4; attempt++) {
      await opportunityPage.goto();
      await tab.click();
      const found = await page
        .getByText(title)
        .first()
        .waitFor({ state: 'visible', timeout: 6000 })
        .then(() => true)
        .catch(() => false);
      if (found) {
        card = page.locator('div[class*="max-w-[680px]"]').filter({ hasText: title }).first();
        break;
      }
      await page.waitForTimeout(3000);
    }

    if (!card) {
      console.warn(`cleanupOpportunityByTitle: could not locate listing "${title}" to unpublish after 4 attempts (best-effort, not failing the test)`);
      return;
    }

    const trigger = card.locator('.ant-dropdown-trigger.aspect-square:visible').first();
    await trigger.click();
    const unpublishItem = page.getByRole('menuitem', { name: 'Unpublish', exact: true });
    await unpublishItem.waitFor({ state: 'visible', timeout: 5000 });
    await unpublishItem.click();
  } catch (err) {
    console.warn(`cleanupOpportunityByTitle: cleanup failed for "${title}" (best-effort, not failing the test): ${err.message}`);
  }
}
