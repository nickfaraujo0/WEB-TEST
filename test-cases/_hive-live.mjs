// Drop-in replacement for `import { test, expect } from '@playwright/test'` — only the
// import line changes, test bodies don't. Wraps the `page` fixture to post a low-quality
// screenshot back to the HIVE dashboard every ~700ms while a test runs, so the Live Run
// board can show a small near-live view of each browser column instead of nothing (or a
// separate OS window). Screenshotting is best-effort: a failure here (closed page,
// mid-navigation, dashboard not running) never fails the actual test.
import { test as base, expect } from '@playwright/test';

const PORT = process.env.HIVE_SERVER_PORT;
const RUN_ID = process.env.HIVE_RUN_ID;
const INTERVAL_MS = 700;

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    if (!PORT || !RUN_ID) {
      // Not running under the HIVE dashboard (e.g. `npx playwright test` directly) — skip.
      await use(page);
      return;
    }

    let live = true;
    const project = testInfo.project.name;

    async function tick() {
      if (!live) return;
      try {
        const buf = await page.screenshot({ type: 'jpeg', quality: 35, timeout: 2000 });
        await fetch('http://127.0.0.1:' + PORT + '/internal/frame', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ runId: RUN_ID, project, image: buf.toString('base64') }),
        }).catch(() => {});
      } catch (e) {
        // page may be closed / mid-navigation / a WebKit quirk — just skip this tick
      }
      if (live) setTimeout(tick, INTERVAL_MS);
    }
    tick();

    try {
      await use(page);
    } finally {
      live = false;
    }
  },
});

export { expect };
