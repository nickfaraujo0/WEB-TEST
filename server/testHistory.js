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

module.exports = { buildHistory, computeBroken, computeCrossBrowserMismatches, computeSkipped };
