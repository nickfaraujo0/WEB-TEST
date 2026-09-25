# HIVE

A web dashboard for selecting, running, and reviewing Playwright test suites. Runs
locally as a small Node/Express app — no build step, no framework.

## Setup

### Test account credentials (do this first)

The suites sign in with real Hive dev accounts. Their emails and passwords are **not** in the
repo — they go in a git-ignored `.env` file at the repo root:

```bash
cp .env.example .env
```

Then fill in the values (ask a teammate for them). Playwright loads `.env` automatically, for
the CLI, the dashboard and Docker alike. A test that needs an account that isn't set fails
with a message naming the missing variable.


### Docker (recommended — same environment on every machine)

Playwright browsers need real OS-level libraries (fonts, codecs, GPU/display deps) that
differ by platform and are the single biggest source of "works on my machine" failures —
Docker sidesteps all of that by using Microsoft's own Playwright image, which ships
Chromium/Firefox/WebKit already installed and working. What this actually buys anyone
else running HIVE:

- **One prerequisite instead of several** — just Docker installed. No "do you have
  Node.js, the right version, did `npm install` run in the repo root and not
  `test-cases/`, does Playwright have the OS libraries it needs" — all of that is already
  baked into the image.
- **Identical environment everywhere** — Windows, Mac, and Linux all run the exact same
  container, so there's no host `node_modules` to get wrong and no OS-specific failure
  mode (this is what fixes a "module not found" error from a fresh clone on Windows).
- **One command to run it** — `docker compose up --build`, then open the dashboard. No
  install dance to walk someone through.

The one real tradeoff: a ~2-3GB one-time image download, since it bundles all three real
browser engines *and* their OS-level dependencies (Playwright installed the normal way
downloads less because it assumes the host already has those libraries — which is exactly
the assumption that breaks on an unfamiliar machine).

```bash
docker compose up --build
```

Then open **http://localhost:4000**. Saved run history (`results/`), Playwright's
screenshot/video/trace output (`test-results/`), and `test-cases/` are bind-mounted from
the host, so run history survives a rebuild and editing or adding a spec doesn't need one.

Without Compose:

```bash
docker build -t hive .
docker run -p 4000:4000 -v "$(pwd)/results:/app/results" -v "$(pwd)/test-cases:/app/test-cases" hive
```

### Without Docker

```bash
npm install
npx playwright install   # downloads the Chromium/Firefox/WebKit binaries Playwright drives
npm start
```

Then open **http://localhost:4000**. `npm install` must run from the repo root (not
`test-cases/`, which has its own `package.json` for an unrelated reason — see below) or the
server's own dependencies (Express, Playwright) never get installed.

## How it works

- **Test Runs** — pick suites/cases and browsers, configure environment/mode/workers/retries,
  then Run Tests. This POSTs to the server, which spawns the real `playwright test` CLI
  with your selection as `file:line` arguments and `--project=<browser>` flags.
- **Live Run** — a custom Playwright reporter (`server/reporter.js`) streams `test-begin` /
  `test-end` events out of the running process over HTTP back to the server, which relays
  them to the browser via Server-Sent Events. The three-column board updates in real time
  as tests actually execute — this isn't simulated. Each column also shows a small live
  screenshot of that browser (refreshed ~every 700ms) via `test-cases/_hive-live.mjs`, a
  drop-in `page` fixture every spec imports instead of `@playwright/test` directly — no
  need for headed mode or an external window to watch a run happen.
- **Results** — every run is saved to `results/<runId>.json`, including real error messages,
  stack traces, step-by-step breakdowns, and attachments (screenshots, video, trace.zip)
  that Playwright captured on failure. Click a failed row to see all of it.
- **Test Cases** — each row shows when it was last run and its latest status; click a row
  to open its full history (every saved run it appeared in, per browser).
- **Reports** — flaky-test detection over the last 10 runs, plus two
  reports built from your full saved history (`server/testHistory.js`): **Currently
  failing**, showing how many consecutive runs (and how long) each broken test has stayed
  broken, per browser; and **Browser mismatches**, tests whose latest result differs
  across browsers (passing on Chromium, failing on WebKit, etc.).

## Project layout

```
server/           Express app, custom reporter, results store, test discovery
public/           Frontend — index.html, styles.css, app.js (no build step)
test-cases/       Playwright specs (see "Test cases" below)
results/          Saved run JSON (gitignored)
playwright.config.js   Projects: chromium, firefox, webkit
```

## Test cases

Drop Playwright spec files into `test-cases/` (`*.spec.js` or `*.spec.ts`). The dashboard
discovers tests by running `playwright test --list`, so anything Playwright can see there
shows up automatically on the Test Runs page — nothing to register by hand.

### What's here now

Four suites imported from `DroidSwarm/DroidSwarmQAgent-Knowledge/tests/web`, all running
against `https://hive-dev.thegritcity.com`:

- **login/** (12 cases) — valid/invalid login, password recovery, session expiry
- **buzz/** (16 cases) — the Buzz feed: create/edit/delete, role restrictions, sharing
- **onboarding/** (18 cases) — sign-up flow, role-specific fields, validation
- **opportunities/** (26 cases) — listings: create, apply, eligibility, file upload, sharing

Each feature folder has its own page-object file(s) (e.g. `login/login-page.js`) that the
`TC0xx_*.spec.js` files import from — keep new specs for a feature in the same folder so
they can share the page object instead of duplicating selectors.

Login credentials live in `test-cases/login/credentials.js` — throwaway dev-account
fallbacks (`nolan@wafer.ee` etc.), overridable by setting the matching env var
(`HIVE_VALID_EMAIL`, `HIVE_VALID_PASSWORD`, ...) before `npm start`.

`test-cases/` is an ES module boundary (`test-cases/package.json` sets `"type": "module"`)
because these specs use `import`/`export` — the rest of the project (the server) stays
CommonJS. New specs can use either `import` or `require`, since Playwright's test runner
supports both regardless of this setting; only plain `.js` files run *outside* Playwright's
own transform would need to match.

### How suites are grouped in the dashboard

- A file with **two or more** distinct top-level `test.describe(...)` blocks keeps each one
  as its own suite, named after the describe title — the author deliberately split it.
- Everything else — a file with no `describe()`, or exactly one wrapping a couple of related
  checks (the pattern most of the specs above use: one `TC0xx_*.spec.js` file per test case)
  — is grouped by its **parent folder**, so `login/TC001_valid_login.spec.js` and eleven
  siblings all land under one "Login" suite instead of twelve tiny ones.
- Describe blocks nested deeper than that are folded into the case title as
  `Parent > Child > test name`.

## Environments

The Environment picker on Test Runs (Dev / Staging / Production) sets `BASE_URL` for the
run, matched to the URLs on the Settings page. **Dev** defaults to
`https://hive-dev.thegritcity.com`, matching where the imported suites actually run —
their page objects hardcode this URL directly rather than reading `BASE_URL`, so it works
regardless of which environment card is selected. Staging/Production are still
placeholders; edit `ENV_URLS` in `public/app.js` (and the Settings page markup) once those
exist.

Tests run against the `baseURL` Playwright config option, which the dashboard sets from the
`BASE_URL` environment variable per run. The imported suites hardcode
`https://hive-dev.thegritcity.com` directly in their page objects rather than using
`baseURL`, so they work the same regardless of which environment card is selected. A new
suite that wants to respect the picker should use relative paths instead:

```js
await page.goto('/login'); // resolved against BASE_URL
```
