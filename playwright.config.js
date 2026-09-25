// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Test account credentials live in the git-ignored .env at the repo root (see .env.example).
// Loaded here so every way of running the suites picks them up — the CLI, the dashboard, and
// Docker. Variables already set in the real environment win over the file.
try {
  process.loadEnvFile(require('path').join(__dirname, '.env'));
} catch (e) {
  // No .env (e.g. CI passing real env vars) — credentials.js reports anything missing.
}

module.exports = defineConfig({
  testDir: './test-cases',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list'],
    ['./server/reporter.js'],
  ],
  // hive-dev.thegritcity.com ships its main bundle uncompressed at ~7.6MB (confirmed via
  // curl: no content-encoding despite a Vary: Accept-Encoding header) — on a slow connection
  // that alone can take minutes, well past Playwright's 30s default. These are NOT
  // WebKit-specific bugs; every browser is equally exposed, WebKit just got unlucky in past
  // runs. Bumped timeouts give real headroom; see also login-page.js etc. using
  // waitUntil: 'domcontentloaded' so goto() doesn't also wait on unrelated third-party
  // resources (Google Fonts, Google APIs, a CDN script) that aren't needed to interact with
  // the page. The real fix is on the app side: compress and/or code-split that bundle.
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: process.env.BASE_URL || 'https://hive-dev.thegritcity.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 45000,
    actionTimeout: 20000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
