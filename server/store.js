const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '..', 'results');

function ensureDir() {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
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

module.exports = { saveRun, loadRun, listRuns, latestRun, RESULTS_DIR };
