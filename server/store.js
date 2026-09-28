const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '..', 'results');
const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts');
const TEST_RESULTS_DIR = path.join(__dirname, '..', 'test-results');
// How many runs keep their screenshots/videos/traces on disk; older runs' artifacts are removed.
const ARTIFACT_KEEP_RUNS = Math.max(1, parseInt(process.env.ARTIFACT_KEEP_RUNS || '20', 10) || 20);

function ensureDir() {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Moves a run's attachments out of test-results/ (Playwright wipes it at the start of every
// run) into artifacts/<runId>/, rewriting each attachment's path, then prunes old runs.
function archiveArtifacts(run) {
  const dest = path.join(ARTIFACTS_DIR, run.id);
  (run.tests || []).forEach((test, ti) => {
    (test.attachments || []).forEach((att, ai) => {
      if (!att.path) return;
      const src = path.resolve(att.path);
      if (!src.startsWith(TEST_RESULTS_DIR + path.sep) || !fs.existsSync(src)) return;
      try {
        fs.mkdirSync(dest, { recursive: true });
        const target = path.join(dest, `${ti}-${ai}-${path.basename(src)}`);
        try {
          fs.renameSync(src, target);
        } catch (e) {
          fs.copyFileSync(src, target);
        }
        att.path = target;
      } catch (e) {
        console.warn(`Could not archive ${src}: ${e.message}`);
      }
    });
  });
  pruneArtifacts();
}

function pruneArtifacts() {
  if (!fs.existsSync(ARTIFACTS_DIR)) return;
  const dirs = fs
    .readdirSync(ARTIFACTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ name: d.name, mtime: fs.statSync(path.join(ARTIFACTS_DIR, d.name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  dirs.slice(ARTIFACT_KEEP_RUNS).forEach((d) => {
    try {
      fs.rmSync(path.join(ARTIFACTS_DIR, d.name), { recursive: true, force: true });
    } catch (e) {}
  });
}

function saveRun(run) {
  ensureDir();
  const file = path.join(RESULTS_DIR, run.id + '.json');
  fs.writeFileSync(file, JSON.stringify(run, null, 2));
  return run;
}

function loadRun(runId) {
  const file = path.join(RESULTS_DIR, runId + '.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return null;
  }
}

function listRuns(limit) {
  ensureDir();
  const files = fs.readdirSync(RESULTS_DIR).filter((f) => f.endsWith('.json'));
  const runs = files
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), 'utf8'));
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
  runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  return typeof limit === 'number' ? runs.slice(0, limit) : runs;
}

function latestRun() {
  return listRuns(1)[0] || null;
}

module.exports = { saveRun, loadRun, listRuns, latestRun, archiveArtifacts, RESULTS_DIR, ARTIFACTS_DIR };
