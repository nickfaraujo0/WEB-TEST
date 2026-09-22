const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const express = require('express');

const store = require('./store');
const { listTests } = require('./testLister');
const { getPlaywrightBin, playwrightInstalled } = require('./playwrightBin');
const testHistory = require('./testHistory');
const bugStore = require('./bugStore');
const gitInfo = require('./gitInfo');
const { classifyFailure, skipReason } = require('./classify');

const PORT = process.env.PORT || 4000;
const ROOT = path.join(__dirname, '..');
const TEST_RESULTS_DIR = path.join(ROOT, 'test-results');
const TEST_CASES_DIR = path.join(ROOT, 'test-cases');

const app = express();
app.use(express.json({ limit: '4mb' })); // frame screenshots (base64 JPEG) can be larger than the 100kb default
app.use(express.static(path.join(ROOT, 'public')));

// ---------------------------------------------------------------------------
// In-memory state for the run that is currently in progress (only one at a time).
// ---------------------------------------------------------------------------
let current = null;
// current = { id, child, clients:Set<res>, events:[], startedAt, tests, browsers,
//             config, testResults:[], metaByKey:{}, lastFrame:{ [project]: base64Jpeg } }

function broadcast(event) {
  if (!current) return;
  current.events.push(event);
  const line = 'data: ' + JSON.stringify(event) + '\n\n';
  current.clients.forEach((res) => {
    try {
      res.write(line);
    } catch (e) {
      /* client gone */
    }
  });
}

// Live screenshot frames get their own path: written straight to connected clients, kept
// as only the latest-per-project (not appended to `events`) since a reconnecting client
// only ever needs to see what's on screen right now, not a full frame history.
function broadcastFrame(runId, project, image) {
  if (!current || current.id !== runId) return;
  current.lastFrame[project] = image;
  const line = 'data: ' + JSON.stringify({ type: 'frame', project, image }) + '\n\n';
  current.clients.forEach((res) => {
    try {
      res.write(line);
    } catch (e) {
      /* client gone */
    }
  });
}

// ---------------------------------------------------------------------------
// Test discovery
// ---------------------------------------------------------------------------
app.get('/api/tests', (req, res) => {
  try {
    const suites = listTests();
    res.json({ suites, playwrightInstalled: true });
  } catch (e) {
    res.status(200).json({ suites: [], playwrightInstalled: playwrightInstalled(), error: e.message });
  }
});

// ---------------------------------------------------------------------------
// Current run status (so the frontend can reconnect after a page reload)
// ---------------------------------------------------------------------------
app.get('/api/status', (req, res) => {
  if (!current) return res.json({ active: false });
  res.json({
    active: true,
    runId: current.id,
    tests: current.tests,
    browsers: current.browsers,
    config: current.config,
    events: current.events,
    lastFrame: current.lastFrame,
  });
});

// ---------------------------------------------------------------------------
// Kick off a run
// ---------------------------------------------------------------------------
app.post('/api/run', (req, res) => {
  if (!playwrightInstalled()) {
    return res.status(400).json({
      error: 'Playwright is not installed. Run "npm install" then "npx playwright install" first.',
    });
  }
  if (current && current.child) {
    return res.status(409).json({ error: 'A run is already in progress.' });
  }

  const body = req.body || {};
  const tests = Array.isArray(body.tests) ? body.tests : [];
  const browsers = Array.isArray(body.browsers) ? body.browsers : [];
  if (!tests.length || !browsers.length) {
    return res.status(400).json({ error: 'Select at least one test case and one browser.' });
  }

  const runId = 'run-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
  const metaByKey = {};
  const args = ['test'];
  tests.forEach((t) => {
    args.push(t.file + ':' + t.line);
    metaByKey[t.file + ':' + t.line] = { title: t.title, suite: t.suite };
  });
  browsers.forEach((b) => args.push('--project=' + b));

  const workers = Math.max(1, parseInt(body.workers, 10) || 1);
  args.push('--workers=' + (body.parallel === false ? 1 : workers));
  args.push('--retries=' + (body.retries ? 2 : 0));
  if (body.mode === 'headed') args.push('--headed');

  let child;
  try {
    child = spawn(getPlaywrightBin(), args, {
      cwd: ROOT,
      env: Object.assign({}, process.env, {
        HIVE_RUN_ID: runId,
        HIVE_SERVER_PORT: String(PORT),
        BASE_URL: body.baseUrl || process.env.BASE_URL || '',
      }),
    });
  } catch (e) {
    return res.status(500).json({ error: 'Could not start Playwright: ' + e.message });
  }

  current = {
    id: runId,
    child,
    clients: new Set(),
    events: [],
    startedAt: new Date().toISOString(),
    tests,
    browsers,
    config: {
      environment: body.environment || 'local',
      mode: body.mode || 'headless',
      workers,
      retries: !!body.retries,
    },
    testResults: [],
    metaByKey,
    lastFrame: {},
    stdout: '',
    stderr: '',
  };

  child.stdout.on('data', (d) => {
    current.stdout += d.toString();
  });
  child.stderr.on('data', (d) => {
    current.stderr += d.toString();
  });
  child.on('error', (err) => {
    broadcast({ type: 'run-error', message: err.message });
  });
  child.on('exit', (code, signal) => {
    finalizeRun(runId, code, signal);
  });

  res.json({ runId });
});

app.post('/api/cancel', (req, res) => {
  if (current && current.child) {
    try {
      current.child.kill();
    } catch (e) {}
  }
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// Live event stream (SSE)
// ---------------------------------------------------------------------------
app.get('/api/stream', (req, res) => {
  const runId = req.query.runId;
  if (!current || current.id !== runId) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');
  current.clients.add(res);
  current.events.forEach((ev) => res.write('data: ' + JSON.stringify(ev) + '\n\n'));
  req.on('close', () => {
    if (current) current.clients.delete(res);
  });
});

// Reporter (running inside the spawned Playwright process) posts events here.
app.post('/internal/event', (req, res) => {
  const { runId, event } = req.body || {};
  if (!runId || !event) return res.status(400).end();
  if (current && current.id === runId) {
    if (event.type === 'test-end') current.testResults.push(event);
    broadcast(event);
  }
  res.status(204).end();
});

// The `_hive-live.mjs` test fixture posts a screenshot here every ~700ms per browser project.
app.post('/internal/frame', (req, res) => {
  const { runId, project, image } = req.body || {};
  if (!runId || !project || !image) return res.status(400).end();
  broadcastFrame(runId, project, image);
  res.status(204).end();
});

function finalizeRun(runId, code, signal) {
  if (!current || current.id !== runId) return;
  const run = buildRunRecord(current, code, signal);
  store.saveRun(run);

  broadcast({ type: 'run-end', status: run.status, runId, summary: summarize(run) });
  current.clients.forEach((res) => {
    try {
      res.end();
    } catch (e) {}
  });
  current = null;
}

function buildRunRecord(state, code, signal) {
  // A test that fails and gets retried produces one test-end event per attempt (same
  // file/line/project, increasing `retry`). Keep only each test's LAST attempt as its
  // canonical result — that's the outcome Playwright itself considers final — but track
  // how many attempts it took so a flaky-but-eventually-passing test is still visible.
  const byKey = new Map();
  state.testResults.forEach((ev) => {
    const key = ev.file + ':' + ev.line + ':' + ev.project;
    const prev = byKey.get(key);
    if (!prev || (ev.retry || 0) >= (prev.retry || 0)) byKey.set(key, ev);
  });
  const attemptCounts = new Map();
  state.testResults.forEach((ev) => {
    const key = ev.file + ':' + ev.line + ':' + ev.project;
    attemptCounts.set(key, (attemptCounts.get(key) || 0) + 1);
  });

  const tests = Array.from(byKey.entries()).map(([key, ev]) => {
    const meta = state.metaByKey[ev.file + ':' + ev.line] || {};
    return {
      title: ev.title,
      suite: meta.suite || null,
      file: ev.file,
      line: ev.line,
      project: ev.project,
      status: ev.status,
      duration: ev.duration,
      attempts: attemptCounts.get(key) || 1,
      error: ev.error,
      steps: ev.steps,
      attachments: ev.attachments,
      category: classifyFailure(ev.status, ev.error),
      reason: ev.status === 'skipped' ? skipReason(ev.annotations) : null,
    };
  });

  const stats = { passed: 0, failed: 0, skipped: 0 };
  tests.forEach((t) => {
    if (t.status === 'passed') stats.passed++;
    else if (t.status === 'skipped') stats.skipped++;
    else stats.failed++; // failed, timedOut, interrupted all count as failed
  });

  const finishedAt = new Date().toISOString();
  const durationMs = new Date(finishedAt).getTime() - new Date(state.startedAt).getTime();
  let status = 'passed';
  if (signal) status = 'cancelled';
  else if (code !== 0 || stats.failed > 0) status = 'failed';

  return {
    id: state.id,
    startedAt: state.startedAt,
    finishedAt,
    status,
    browsers: state.browsers,
    config: state.config,
    totalCases: state.tests.length,
    executions: tests.length,
    expectedExecutions: state.tests.length * state.browsers.length,
    stats,
    durationMs,
    tests,
  };
}

function summarize(run) {
  const avgTestMs = run.tests.length ? run.tests.reduce((sum, t) => sum + (t.duration || 0), 0) / run.tests.length : 0;
  return {
    id: run.id,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    status: run.status,
    browsers: run.browsers,
    totalCases: run.totalCases,
    executions: run.executions,
    stats: run.stats,
    durationMs: run.durationMs,
    avgTestMs,
  };
}

// ---------------------------------------------------------------------------
// Results / history / reports
// ---------------------------------------------------------------------------
app.get('/api/history', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  res.json({ runs: store.listRuns(limit).map(summarize) });
});

app.get('/api/results/latest', (req, res) => {
  const run = store.latestRun();
  if (!run) return res.status(404).json({ error: 'No runs yet' });
  res.json(run);
});

app.get('/api/results/:id', (req, res) => {
  const run = store.loadRun(req.params.id);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json(run);
});

app.get('/api/reports', (req, res) => {
  const runs = store.listRuns(10).reverse();

  const trend = runs
    .map((r) => {
      const total = r.stats.passed + r.stats.failed;
      return {
        id: r.id,
        shortId: r.id.slice(-6),
        passRate: total > 0 ? Math.round((r.stats.passed / total) * 1000) / 10 : null,
        finishedAt: r.finishedAt,
      };
    })
    .filter((p) => p.passRate !== null);

  const seen = {};
  runs.forEach((r) => {
    (r.tests || []).forEach((t) => {
      const key = t.title + '||' + t.project;
      seen[key] = seen[key] || { title: t.title, suite: t.suite, project: t.project, pass: 0, fail: 0, lastRun: r.id };
      if (t.status === 'passed') seen[key].pass++;
      else seen[key].fail++;
      seen[key].lastRun = r.id;
    });
  });
  const flaky = Object.values(seen)
    .filter((t) => t.pass > 0 && t.fail > 0)
    .map((t) => ({ ...t, flakeRate: Math.round((t.fail / (t.pass + t.fail)) * 100) }))
    .sort((a, b) => b.flakeRate - a.flakeRate)
    .slice(0, 10);

  // Broken-duration and cross-browser mismatch both benefit from a longer look-back than
  // the 10-run trend chart, so they're computed from a separate, wider history build.
  const history = testHistory.buildHistory(200);
  const broken = testHistory.computeBroken(history).slice(0, 20);
  const crossBrowser = testHistory.computeCrossBrowserMismatches(history).slice(0, 20);
  const skipped = testHistory.computeSkipped(history).slice(0, 20);

  res.json({ trend, flaky, broken, crossBrowser, skipped });
});

// Full per-test history (every saved run each test appeared in), keyed by "file:line" — powers
// the "last run" column on Test Cases and the history drawer when a row is clicked.
app.get('/api/test-history', (req, res) => {
  res.json({ tests: testHistory.buildHistory(200) });
});

// ---------------------------------------------------------------------------
// Version control (read-only) — git status/history/diff for the specs in test-cases/, shown on
// the Test Cases tab. Nothing here ever commits, pushes or otherwise changes the repository.
// ---------------------------------------------------------------------------
app.get('/api/git/status', async (req, res) => {
  res.json(await gitInfo.status());
});

app.get('/api/git/history', async (req, res) => {
  const out = await gitInfo.history(req.query.file);
  if (out.error) return res.status(out.status).json({ error: out.error });
  res.json(out);
});

app.get('/api/git/diff', async (req, res) => {
  const out = await gitInfo.diff(req.query.file, req.query.commit);
  if (out.error) return res.status(out.status).json({ error: out.error });
  res.json(out);
});

// ---------------------------------------------------------------------------
// Bug log — bugs found while running the suites, each with the date it was found and the
// test case(s) that exposed it. Persisted to data/bugs.json (see bugStore.js).
// ---------------------------------------------------------------------------
function sendBugError(res, err) {
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Could not save the bug log' });
}

app.get('/api/bugs', (req, res) => {
  res.json({ bugs: bugStore.list() });
});

app.post('/api/bugs', (req, res) => {
  try {
    res.status(201).json({ bug: bugStore.create(req.body) });
  } catch (err) {
    sendBugError(res, err);
  }
});

app.put('/api/bugs/:id', (req, res) => {
  try {
    const bug = bugStore.update(req.params.id, req.body);
    if (!bug) return res.status(404).json({ error: 'Bug not found' });
    res.json({ bug });
  } catch (err) {
    sendBugError(res, err);
  }
});

app.delete('/api/bugs/:id', (req, res) => {
  try {
    if (!bugStore.remove(req.params.id)) return res.status(404).json({ error: 'Bug not found' });
    res.status(204).end();
  } catch (err) {
    sendBugError(res, err);
  }
});

// ---------------------------------------------------------------------------
// Attachments (screenshots / traces / videos) — served from Playwright's own
// test-results output directory only, never arbitrary paths.
// ---------------------------------------------------------------------------
app.get('/api/attachment/:runId/:testIndex/:attIndex', (req, res) => {
  const run = store.loadRun(req.params.runId);
  if (!run) return res.status(404).end();
  const test = run.tests[parseInt(req.params.testIndex, 10)];
  if (!test) return res.status(404).end();
  const att = (test.attachments || [])[parseInt(req.params.attIndex, 10)];
  if (!att || !att.path) return res.status(404).end();

  const resolved = path.resolve(att.path);
  if (!resolved.startsWith(TEST_RESULTS_DIR + path.sep) && resolved !== TEST_RESULTS_DIR) {
    return res.status(403).end();
  }
  if (!fs.existsSync(resolved)) return res.status(404).end();
  res.sendFile(resolved);
});

// Raw source of a spec file, for the Test Cases code viewer — served only from inside
// test-cases/, same path-containment check used for attachments above.
app.get('/api/source', (req, res) => {
  const file = req.query.file;
  if (!file) return res.status(400).end();
  const resolved = path.resolve(file);
  if (!resolved.startsWith(TEST_CASES_DIR + path.sep)) return res.status(403).end();
  if (!fs.existsSync(resolved)) return res.status(404).end();
  fs.readFile(resolved, 'utf8', (err, content) => {
    if (err) return res.status(500).end();
    res.json({ file: resolved, content });
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('  HIVE dashboard running at http://localhost:' + PORT);
  console.log('');
  if (!playwrightInstalled()) {
    console.log('  ⚠ Playwright is not installed yet. Run:');
    console.log('    npm install');
    console.log('    npx playwright install');
    console.log('');
  }
});
