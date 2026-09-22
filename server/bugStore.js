const fs = require('fs');
const path = require('path');

// Kept outside results/ on purpose: store.listRuns() parses every *.json in results/ as a run.
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'bugs.json');

const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const STATUSES = ['open', 'fixed', 'wontfix'];
const BROWSERS = ['chromium', 'firefox', 'webkit'];

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8')).bugs || [];
  } catch (e) {
    return [];
  }
}

function writeAll(bugs) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify({ bugs }, null, 2));
  fs.renameSync(tmp, FILE);
}

function invalid(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function todayLocal() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function isRealDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function text(value, max, label, required) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (required && !s) throw invalid(label + ' is required');
  if (s.length > max) throw invalid(label + ' must be at most ' + max + ' characters');
  return s;
}

// Validates and normalises a bug payload. `existing` (when updating) supplies defaults for
// fields the caller left out and lets fixedAt survive edits that don't change the status.
function clean(input, existing) {
  const body = input || {};
  const merged = Object.assign({}, existing || {}, body);

  const title = text(merged.title, 200, 'Title', true);
  const description = text(merged.description, 5000, 'Description', false);
  const notes = text(merged.notes, 5000, 'Notes', false);

  if (!SEVERITIES.includes(merged.severity)) throw invalid('Severity must be one of: ' + SEVERITIES.join(', '));
  if (!STATUSES.includes(merged.status)) throw invalid('Status must be one of: ' + STATUSES.join(', '));
  if (!isRealDate(merged.foundAt)) throw invalid('Date found must be a real date in YYYY-MM-DD format');

  const browsers = Array.isArray(merged.browsers) ? merged.browsers : [];
  if (browsers.some((b) => !BROWSERS.includes(b))) throw invalid('Browsers must be from: ' + BROWSERS.join(', '));

  const rawCases = Array.isArray(merged.testCases) ? merged.testCases : [];
  if (rawCases.length > 50) throw invalid('At most 50 test cases can be linked');
  const testCases = rawCases.map((tc) => ({
    file: text(tc && tc.file, 300, 'Test case file', false),
    title: text(tc && tc.title, 300, 'Test case title', true),
    suite: text(tc && tc.suite, 200, 'Test case suite', false),
  }));

  const runId = merged.runId ? text(merged.runId, 100, 'Run', false) : null;

  let fixedAt = null;
  if (merged.status === 'fixed') {
    fixedAt = merged.fixedAt && isRealDate(merged.fixedAt) ? merged.fixedAt : todayLocal();
  }

  return { title, description, severity: merged.severity, status: merged.status, foundAt: merged.foundAt, fixedAt, browsers, testCases, runId, notes };
}

function nextId(bugs) {
  const max = bugs.reduce((m, b) => Math.max(m, parseInt(String(b.id).replace(/\D/g, ''), 10) || 0), 0);
  return 'BUG-' + String(max + 1).padStart(3, '0');
}

function list() {
  return readAll();
}

function create(input) {
  const bugs = readAll();
  const now = new Date().toISOString();
  const bug = Object.assign({ id: nextId(bugs) }, clean(input), { createdAt: now, updatedAt: now });
  bugs.push(bug);
  writeAll(bugs);
  return bug;
}

function update(id, input) {
  const bugs = readAll();
  const i = bugs.findIndex((b) => b.id === id);
  if (i === -1) return null;
  const bug = Object.assign({}, bugs[i], clean(input, bugs[i]), { id, updatedAt: new Date().toISOString() });
  bugs[i] = bug;
  writeAll(bugs);
  return bug;
}

function remove(id) {
  const bugs = readAll();
  const next = bugs.filter((b) => b.id !== id);
  if (next.length === bugs.length) return false;
  writeAll(next);
  return true;
}

module.exports = { list, create, update, remove, SEVERITIES, STATUSES, BROWSERS };
