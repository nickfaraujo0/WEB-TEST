# HIVE

A web dashboard for selecting, running and reviewing [Playwright](https://playwright.dev) test
suites for the Hive web app (`hive-dev.thegritcity.com`).

HIVE is a small Node/Express app with a plain HTML/CSS/JS front end — no build step, no
framework, no database. Pick suites in the browser, watch them run live across Chromium,
Firefox and WebKit, then dig into failures, flaky tests and history.

> The project and its environment variables are called HIVE; the dashboard UI itself is branded
> **QAgent**.

## Features

- **Overview** — at-a-glance health: pass rate by run, suite health, tests needing attention
  and open bugs.
- **Test Runs** — choose suites or individual cases, browsers, environment, headed/headless
  mode, workers and retries, then run. Runs can be queued; one executes at a time.
- **Live Run** — real-time pass/fail board per browser, an embedded terminal, a live ETA, and a
  small live screenshot of each browser (~every 700 ms).
- **Results** — every run is saved with error messages, stack traces, steps and attachments
  (screenshots, video, trace.zip).
- **Test Cases** — last status and full per-browser history for every case.
- **Reports** — suite summary, flaky-test detection, currently failing tests (with streak
  length) and browser mismatches.
- **Bugs** — a built-in bug log linked to failing tests.
- **Git** — working-tree status, history and diffs of the test code.
- **Google Sheet** — view, edit and append to the master test sheet, sync test credentials, and
  jump to the sheet with the **Open in Google Sheets** button.
- **Settings** — environments, defaults and notifications.
- **Source editor** — view and edit spec files from the dashboard.

## Quick start

### 1. Test account credentials

The suites sign in with real Hive dev accounts. These are **not** in the repo; they live in a
git-ignored `.env` at the repo root.

```bash
cp .env.example .env
```

Fill in the values (ask a teammate). Playwright loads `.env` for the CLI, the dashboard and
Docker alike. A test whose account isn't set fails with a message naming the missing variable.

### 2a. Docker (recommended)

Uses Microsoft's Playwright image, which ships all three browsers and their OS libraries, so it
behaves the same on macOS, Windows and Linux. Requires only Docker (one-time ~2–3 GB image).

```bash
docker compose up --build
```

Open **http://localhost:4000**. `results/`, `test-results/`, `data/` and `test-cases/` are
bind-mounted, so history survives rebuilds and editing a spec needs no rebuild.

### 2b. Without Docker

Requires Node.js 20.12+ (the config uses `process.loadEnvFile`).

```bash
npm install                # run from the repo root, not test-cases/
npx playwright install     # downloads Chromium, Firefox and WebKit
npm start
```

Open **http://localhost:4000**.

## Architecture

```
Browser (public/)
   │  REST /api/*              ▲ SSE /api/stream (events + live frames)
   ▼                           │
Express server (server/index.js, port 4000)
   │  spawn `playwright test file:line --project=… --workers=…`
   ▼
Playwright child process ── test-cases/**
   ├─ server/reporter.js     ── POST /internal/event ─▶ server ─SSE─▶ browser
   └─ test-cases/_hive-live.mjs ─ POST /internal/frame ─▶ server ─SSE─▶ browser
```

1. The dashboard `POST`s a selection to `/api/run`.
2. The server spawns the real `playwright test` CLI with `file:line` arguments and
   `--project=<browser>` flags.
3. A custom reporter (`server/reporter.js`) posts `test-begin`/`test-end` events back to the
   server over loopback, which relays them to the browser via Server-Sent Events.
4. Each spec imports `page` from `_hive-live.mjs`, which streams periodic screenshots the same way.
5. On completion the run is saved to `results/<runId>.json` and its artifacts are archived to
   `artifacts/<runId>/`.

### Project layout

```
server/            Express app and supporting modules
  index.js           routes, run/queue management, SSE
  reporter.js        custom Playwright reporter
  store.js           run records + artifact archiving
  testLister.js      discovers tests via `playwright test --list`
  testHistory.js     per-test history, flaky/failing/mismatch reports
  bugStore.js        bug log (data/bugs.json)
  gitInfo.js         git status/history/diff
  googleSheets.js, credentialsSheet.js   Google Sheet integration
  classify.js        failure classification
public/            Front end: index.html, app.js, styles.css, sheet.css
test-cases/        Playwright specs, grouped by feature (+ shared helpers)
results/           Saved run JSON (one file per run)
artifacts/         Archived screenshots/videos/traces (last 20 runs, git-ignored)
test-results/      Playwright's own output, wiped each run (git-ignored)
data/              Bug log and queue
playwright.config.js   Projects: chromium, firefox, webkit
Dockerfile, docker-compose*.yml, Caddyfile   Deployment
```

## Test suites

All suites run against `https://hive-dev.thegritcity.com`.

| Suite | Specs | Covers |
|---|---:|---|
| `login/` | 14 | Valid/invalid login, password recovery, session expiry |
| `onboarding/` | 18 | Sign-up flow, role-specific fields, validation |
| `buzz/` | 54 | Buzz feed: create/edit/delete, recipients, boards, sharing, formatting |
| `likes-comments/` | 34 | Likes and comments |
| `opportunities/` | 27 | Listings: create, apply, eligibility, uploads, sharing |
| `courses/` | 116 | Courses and schedule |
| `profile/` | 31 | Profile |
| `reports/` | 34 | Attendance and assessment reports |

The master list of test cases is the live Google Sheet "(master)". Blue tabs are the cases
already ported to web; uncoloured tabs are still to port.

### Writing a test

Drop a `TC0xx_name.spec.js` into the matching `test-cases/<feature>/` folder. The dashboard finds
it automatically via `playwright test --list` — nothing to register.

- Import `test`/`expect` and the `page` fixture from `_hive-live.mjs` (not directly from
  `@playwright/test`) so the live screenshot stream works.
- Keep selectors in the feature's page-object files (e.g. `buzz/buzz-page.js`) rather than duplicating them.
- `test-cases/` is an ES-module boundary (`"type": "module"`); the server stays CommonJS.
- To respect the Environment picker use relative URLs (`page.goto('/login')`, resolved against
  `BASE_URL`). The existing page objects hardcode the dev URL.

**How suites are grouped in the dashboard:** a file with two or more top-level `test.describe`
blocks keeps each as its own suite; otherwise tests are grouped by parent folder. Nested describes
are folded into the title as `Parent > Child > test`.

## Configuration

Set in `.env` (see `.env.example`) or the environment.

| Variable | Purpose |
|---|---|
| `HIVE_VALID_EMAIL` / `_PASSWORD` | Main Professor (Faculty) account |
| `HIVE_STUDENT_EMAIL` / `_PASSWORD` | Student account |
| `HIVE_PROFESSOR2_EMAIL` / `_PASSWORD` | Second Professor |
| `HIVE_DEACTIVATED_EMAIL` / `_PASSWORD` | Deactivated account (Login TC008) |
| `BASE_URL` | Environment under test (default `https://hive-dev.thegritcity.com`) |
| `PORT` | Dashboard port (default `4000`) |
| `ARTIFACT_KEEP_RUNS` | Runs whose artifacts are kept (default `20`) |
| `HIVE_AUTH_USER` / `HIVE_AUTH_PASS` | Require basic-auth login on the dashboard (hosted mode) |
| `HIVE_DOMAIN` | Public hostname Caddy serves in hosted mode |
| `GOOGLE_SERVICE_ACCOUNT_FILE`, `GOOGLE_SHEET_ID` | Google Sheet integration |
| `SHEET_ALLOW_REMOTE` | Allow Sheet routes for non-local requests (only safe behind auth) |
| `HIVE_STUDENT_POOL_EMAIL_PATTERN` / `_RANGE` / `_PASSWORD` | Student account pool used by the credentials sync |

### Google Sheet integration

Place a service-account key at `server/google-key.json` (git-ignored) and set the sheet id via
`GOOGLE_SHEET_ID` or `server/sheet-config.json`. Share the sheet with the service account's email
as **Editor**. The **Open in Google Sheets** button on the Google Sheet page is built from that id.

## Hosting for a team

See [DEPLOY.md](DEPLOY.md). In short:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

This adds Caddy for automatic HTTPS, closes direct access to port 4000, and requires
`HIVE_AUTH_USER`/`HIVE_AUTH_PASS`. Never expose port 4000 directly: `/api/source` can rewrite specs,
which are executed code.

## Languages and stack

JavaScript throughout (Node.js/CommonJS server, vanilla browser JS, ES-module test helpers), plus
HTML, CSS, JSON and YAML config. Runtime dependencies: `express` and `@playwright/test`.
