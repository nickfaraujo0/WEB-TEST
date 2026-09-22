// @ts-check
import { test, expect } from '../_hive-live.mjs';
import { loginAs, withQaPost } from './likes-comments-helpers.js';

/**
 * Web-only accessibility gap, confirmed live: the like, comment and share icons are plain
 * div/svg elements with no role, tabindex, aria-label, or button/link inside or around them
 * (within the icon row), so a keyboard or screen-reader user cannot reach or name them.
 */
test('TC008 - Verify the like, comment and share icons have no role, label or keyboard focus (bug)', async ({ page }) => {
  await loginAs(page);
  await withQaPost(page, 'TC008 a11y', async (post) => {
    const icons = await post.card.locator('.reactions > *').evaluateAll((els) =>
      els.map((e) => ({
        role: e.getAttribute('role'),
        tabindex: e.getAttribute('tabindex'),
        label: e.getAttribute('aria-label'),
        interactive: e.matches('button, a, [role="button"]') || !!e.querySelector('button, a, [role="button"], [tabindex]'),
      })),
    );

    expect(icons).toHaveLength(3);
    for (const icon of icons) {
      expect(icon).toEqual({ role: null, tabindex: null, label: null, interactive: false });
    }
  });
});
