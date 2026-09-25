const store = require('./store');

// Builds a per-test history from saved runs: { "<file>:<line>": { file, line, title, suite,
// lastRunAt, byProject: { [project]: latestPoint }, history: [point, ...] } }, history sorted
// oldest -> newest. `byProject` ends up holding each project's most recent point because we
// walk the runs oldest-first and just keep overwriting.
function buildHistory(limitRuns) {
  const runs = store.listRuns(limitRuns); // newest first
  const byTest = new Map();

  runs
    .slice()
    .reverse() // oldest -> newest
    .forEach((run) => {
      (run.tests || []).forEach((t) => {
        const key = t.file + ':' + t.line;
        if (!byTest.has(key)) {
          byTest.set(key, { file: t.file, line: t.line, title: t.title, suite: t.suite, byProject: {}, history: [] });
        }
        const entry = byTest.get(key);
        const point = {
          runId: run.id,
          project: t.project,
          status: t.status,
          duration: t.duration,
          attempts: t.attempts,
          finishedAt: run.finishedAt,
          category: t.category || null,
          reason: t.reason || null,
          errorMessage: (t.error && t.error.message) || null,
        };
        entry.history.push(point);
        entry.byProject[t.project] = point;
        if (t.title) entry.title = t.title;
        if (t.suite) entry.suite = t.suite;
      });
    });

  const result = {};
  byTest.forEach((entry, key) => {
    let lastRunAt = null;
    entry.history.forEach((p) => {
      if (!lastRunAt || p.finishedAt > lastRunAt) lastRunAt = p.finishedAt;
    });
    result[key] = { file: entry.file, line: entry.line, title: entry.title, suite: entry.suite, lastRunAt, byProject: entry.byProject, history: entry.history };
  });
  return result;
}

const FAILING_STATUSES = new Set(['failed', 'timedOut', 'interrupted']);

// For each (test, browser) whose most recent result is a failure, walk backwards through
// that browser's history to find when the current failing streak started.
function computeBroken(history) {
  const broken = [];
  Object.keys(history).forEach((key) => {
    const entry = history[key];
    Object.keys(entry.byProject).forEach((project) => {
      const projHistory = entry.history.filter((p) => p.project === project);
      const latest = projHistory[projHistory.length - 1];
      if (!latest || !FAILING_STATUSES.has(latest.status)) return;

      let since = latest.finishedAt;
      let runsFailing = 0;
      for (let i = projHistory.length - 1; i >= 0; i--) {
        const p = projHistory[i];
        if (!FAILING_STATUSES.has(p.status)) break;
        since = p.finishedAt;
        runsFailing++;
      }
      broken.push({
        file: entry.file,
        line: entry.line,
        title: entry.title,
        suite: entry.suite,
        project,
        failingSince: since,
        runsFailing,
        category: latest.category || null,
        errorMessage: latest.errorMessage || null,
      });
    });
  });
  broken.sort((a, b) => (a.failingSince < b.failingSince ? -1 : 1)); // longest-broken first
  return broken;
}

// Tests whose most recent result on any browser is 'skipped' — a pass/fail dashboard hides
// these entirely, but a skip usually has a real reason (missing test data, an unsafe
// side effect) worth surfacing rather than silently excluding the case from coverage.
function computeSkipped(history) {
  const skipped = [];
  Object.keys(history).forEach((key) => {
    const entry = history[key];
    const skippedProjects = Object.keys(entry.byProject).filter((p) => entry.byProject[p].status === 'skipped');
    if (!skippedProjects.length) return;
    const reason = skippedProjects.map((p) => entry.byProject[p].reason).find(Boolean) || null;
    skipped.push({
      file: entry.file,
      line: entry.line,
      title: entry.title,
      suite: entry.suite,
      projects: skippedProjects,
      reason,
      lastRunAt: entry.lastRunAt,
    });
  });
  skipped.sort((a, b) => (a.title < b.title ? -1 : 1));
  return skipped;
}

// Tests where the most recent result differs across browsers — passing on one, not on another.
function computeCrossBrowserMismatches(history) {
  const mismatches = [];
  Object.keys(history).forEach((key) => {
    const entry = history[key];
    const projects = Object.keys(entry.byProject);
    if (projects.length < 2) return;
    const statuses = projects.map((p) => entry.byProject[p].status);
    if (statuses.every((s) => s === statuses[0])) return;
    mismatches.push({
      file: entry.file,
      line: entry.line,
      title: entry.title,
      suite: entry.suite,
      results: projects.map((p) => ({
        project: p,
        status: entry.byProject[p].status,
        finishedAt: entry.byProject[p].finishedAt,
        category: entry.byProject[p].category || null,
        reason: entry.byProject[p].reason || null,
        errorMessage: entry.byProject[p].errorMessage || null,
      })),
    });
  });
  return mismatches;
}

// Per-suite rollup across every saved run: lifetime totals plus a per-run timeline (oldest ->
// newest) so the Reports page can show how each suite's pass rate has moved over time.
function computeSuiteSummary(limitRuns, timelineLength) {
  const runs = store.listRuns(limitRuns).slice().reverse(); // oldest -> newest
  const bySuite = new Map();

  runs.forEach((run) => {
    const perRun = new Map();
    (run.tests || []).forEach((t) => {
      const name = t.suite || 'Other';
      if (!perRun.has(name)) perRun.set(name, { passed: 0, failed: 0, skipped: 0, duration: 0, cases: new Set() });
      const pr = perRun.get(name);
      if (t.status === 'passed') pr.passed++;
      else if (t.status === 'skipped') pr.skipped++;
      else if (FAILING_STATUSES.has(t.status)) pr.failed++;
      pr.duration += t.duration || 0;
      pr.cases.add(t.file + ':' + t.line);
    });

    perRun.forEach((pr, name) => {
      if (!bySuite.has(name)) {
        bySuite.set(name, { suite: name, runs: 0, executions: 0, passed: 0, failed: 0, skipped: 0, duration: 0, cases: new Set(), firstRunAt: run.startedAt, timeline: [] });
      }
      const s = bySuite.get(name);
      const ran = pr.passed + pr.failed;
      s.runs++;
      s.executions += pr.passed + pr.failed + pr.skipped;
      s.passed += pr.passed;
      s.failed += pr.failed;
      s.skipped += pr.skipped;
      s.duration += pr.duration;
      pr.cases.forEach((c) => s.cases.add(c));
      s.timeline.push({
        runId: run.id,
        startedAt: run.startedAt,
        passed: pr.passed,
        failed: pr.failed,
        skipped: pr.skipped,
        passRate: ran ? Math.round((pr.passed / ran) * 100) : null,
      });
    });
  });

  return Array.from(bySuite.values())
    .map((s) => {
      const ran = s.passed + s.failed;
      const rated = s.timeline.filter((p) => p.passRate !== null);
      const last = rated[rated.length - 1] || null;
      const prev = rated[rated.length - 2] || null;
      return {
        suite: s.suite,
        runs: s.runs,
        cases: s.cases.size,
        executions: s.executions,
        passed: s.passed,
        failed: s.failed,
        skipped: s.skipped,
        passRate: ran ? Math.round((s.passed / ran) * 100) : null,
        avgTestMs: s.executions ? Math.round(s.duration / s.executions) : 0,
        firstRunAt: s.firstRunAt,
        lastRunAt: s.timeline[s.timeline.length - 1].startedAt,
        lastPassRate: last ? last.passRate : null,
        change: last && prev ? last.passRate - prev.passRate : null,
        timeline: s.timeline.slice(-timelineLength),
      };
    })
    .sort((a, b) => a.suite.localeCompare(b.suite));
}

module.exports = { buildHistory, computeBroken, computeCrossBrowserMismatches, computeSkipped, computeSuiteSummary };
