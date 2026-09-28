// Builds the "Credentials" tab of the Google Sheet from test-cases/login/credentials.js.
// Runs server-side: the values go from the environment / .env straight to Google and are
// never returned to the browser by the sync endpoint.
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const sheets = require('./googleSheets');

const ROOT = path.join(__dirname, '..');
const TEST_CASES_DIR = path.join(ROOT, 'test-cases');
const CREDENTIALS_FILE = path.join(TEST_CASES_DIR, 'login', 'credentials.js');

const TAB = 'Credentials';
const HEADER = ['Account', 'Email', 'Password', 'Type', 'Used In', 'Comments'];

// Seed Type / Comments for the known accounts. Only used when the sheet cell is empty —
// anything edited in the sheet (or the dashboard) is never overwritten by a sync.
const ACCOUNT_META = {
  VALID: {
    type: 'Professor (faculty)',
    comments: 'Main throwaway dev-build faculty account (same one the DroidSwarm Appium suite uses). Default login for the logged-in suites.',
  },
  STUDENT: {
    type: 'Student',
    comments: 'Enrolled student — counterpart to the professor for role-based checks (e.g. only professors can create listings / Buzz).',
  },
  PROFESSOR2: {
    type: 'Professor (faculty)',
    comments: 'A second professor, distinct from VALID — for "another professor cannot edit/delete this post" checks.',
  },
  DEACTIVATED: {
    type: 'Deactivated student',
    comments: 'Account deactivated on the backend — login must be refused (login TC008).',
  },
  INSTRUCTOR: {
    type: 'Instructor',
    comments: 'Hive instructor account — not used by any spec yet; listed for manual testing.',
  },
  ADMIN: {
    type: 'Admin',
    comments: 'Hive admin account — not used by any spec yet; listed for manual testing.',
  },
  INVALID: {
    type: 'Negative-test data',
    comments: 'Deliberately wrong password for an otherwise valid email (login TC002).',
  },
  UNREGISTERED: {
    type: 'Negative-test data',
    comments: 'Well-formed email that is not a registered account (login TC003).',
  },
  MALFORMED: {
    type: 'Negative-test data',
    comments: "Malformed email with no '@' (login TC007).",
  },
};

/** { KEY: { email, password, envNames:[...] } } from HIVE_<KEY>_EMAIL / HIVE_<KEY>_PASSWORD names. */
function groupAccounts(creds) {
  const groups = {};
  Object.keys(creds).forEach((name) => {
    const m = name.match(/^HIVE_(.+?)_(EMAIL|PASSWORD)$/);
    if (!m) return;
    const g = groups[m[1]] || (groups[m[1]] = { key: m[1], email: '', password: '', envNames: [] });
    g[m[2].toLowerCase()] = creds[name];
    g.envNames.push(name);
  });
  return Object.keys(groups).map((k) => groups[k]);
}

/**
 * Optional pool of extra student accounts, configured in .env:
 *   HIVE_STUDENT_POOL_EMAIL_PATTERN  e.g. student{NNNN}@test.com   ({NNNN} = zero-padded number)
 *   HIVE_STUDENT_POOL_RANGE          e.g. 1-20 (default)
 *   HIVE_STUDENT_POOL_PASSWORD       falls back to HIVE_STUDENT_PASSWORD
 */
function studentPool(creds) {
  const pattern = process.env.HIVE_STUDENT_POOL_EMAIL_PATTERN;
  if (!pattern) return [];
  const range = (process.env.HIVE_STUDENT_POOL_RANGE || '1-20').match(/^(\d+)\s*-\s*(\d+)$/);
  if (!range) return [];
  const password = process.env.HIVE_STUDENT_POOL_PASSWORD || creds.HIVE_STUDENT_PASSWORD || '';
  const out = [];
  for (let n = Number(range[1]); n <= Number(range[2]); n++) {
    const padded = pattern.match(/\{(N+)\}/);
    const num = padded ? String(n).padStart(padded[1].length, '0') : String(n);
    out.push({ number: n, email: pattern.replace(/\{N+\}/, num), password });
  }
  return out;
}

/** Scan test-cases for references to each env name → "suite: TC002, TC003; …". */
function findUsages(envNamesByAccount) {
  const usage = {}; // key -> Set("suite/label")
  const files = [];
  (function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
      if (e.name === 'node_modules') return;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.js') && p !== CREDENTIALS_FILE) files.push(p);
    });
  })(TEST_CASES_DIR);

  files.forEach((file) => {
    let src;
    try {
      src = fs.readFileSync(file, 'utf8');
    } catch (e) {
      return;
    }
    const rel = path.relative(TEST_CASES_DIR, file).split(path.sep);
    const suite = rel.length > 1 ? rel[0] : '';
    const tc = path.basename(file).match(/^(TC\d+)/i);
    const label = tc ? tc[1].toUpperCase() : path.basename(file, '.js'); // helpers show by file name
    Object.keys(envNamesByAccount).forEach((key) => {
      if (envNamesByAccount[key].some((n) => src.indexOf(n) !== -1)) {
        (usage[key] || (usage[key] = {}))[suite] = (usage[key][suite] || new Set()).add(label);
      }
    });
  });

  const fmt = {};
  Object.keys(usage).forEach((key) => {
    let shown = 0;
    const parts = [];
    let total = 0;
    Object.keys(usage[key]).forEach((s) => (total += usage[key][s].size));
    Object.keys(usage[key]).sort().forEach((s) => {
      const labels = Array.from(usage[key][s]).sort();
      const room = Math.max(0, 14 - shown);
      const take = labels.slice(0, room);
      shown += take.length;
      if (take.length) parts.push((s ? s + ': ' : '') + take.join(', '));
    });
    fmt[key] = parts.join('; ') + (total > shown ? ' (+' + (total - shown) + ' more)' : '');
  });
  return fmt;
}

async function loadCredentials() {
  const mod = await import(pathToFileURL(CREDENTIALS_FILE).href);
  const creds = mod.allCredentials();
  // Accounts no spec uses yet (e.g. HIVE_ADMIN_EMAIL / HIVE_ADMIN_PASSWORD in .env) still get listed.
  Object.keys(process.env).forEach((name) => {
    if (/^HIVE_.+_(EMAIL|PASSWORD)$/.test(name) && !/^HIVE_STUDENT_POOL_/.test(name) && !(name in creds)) {
      creds[name] = process.env[name];
    }
  });
  return creds;
}

/** Compute the rows the code says should exist: [{ key, row:[6 cols], seedType, seedComments }]. */
async function buildRows() {
  const creds = await loadCredentials();
  const accounts = groupAccounts(creds);
  const usages = findUsages(Object.fromEntries(accounts.map((a) => [a.key, a.envNames])));
  const rows = accounts.map((a) => {
    const meta = ACCOUNT_META[a.key] || { type: '', comments: '' };
    return {
      key: a.key,
      cols: [a.key, a.email, a.password, meta.type, usages[a.key] || '', meta.comments],
      seed: { type: meta.type, comments: meta.comments },
    };
  });

  const named = new Set(accounts.map((a) => a.email.toLowerCase()).filter(Boolean));
  studentPool(creds).forEach((s) => {
    if (named.has(s.email.toLowerCase())) return; // already listed under its role
    const n = String(s.number).padStart(2, '0');
    rows.push({
      key: 'STUDENT_POOL_' + n,
      cols: ['STUDENT_POOL_' + n, s.email, s.password, 'Student', '', 'Pool student account — verify this login still works.'],
      seed: { type: 'Student', comments: 'Pool student account — verify this login still works.' },
    });
  });
  return rows;
}

/**
 * Upsert the code's accounts into the Credentials tab. Existing rows keep their position and
 * any Type/Comments already filled in; rows that exist only in the sheet are left alone.
 */
async function sync() {
  const created = await sheets.ensureTab(TAB);
  const existing = created ? [] : await sheets.readTab(TAB);
  const body = existing.length && existing[0][0] === HEADER[0] ? existing.slice(1) : existing;
  const table = body.map((r) => {
    const row = r.slice(0, HEADER.length);
    while (row.length < HEADER.length) row.push('');
    return row;
  });
  const indexByKey = {};
  table.forEach((r, i) => (indexByKey[r[0]] = i));

  let added = 0;
  let updated = 0;
  (await buildRows()).forEach((r) => {
    const i = indexByKey[r.key];
    if (i === undefined) {
      table.push(r.cols);
      added++;
    } else {
      const cur = table[i];
      table[i] = [
        r.cols[0],
        r.cols[1],
        r.cols[2],
        cur[3] || r.cols[3], // keep hand-edited Type
        r.cols[4] || cur[4], // Used In is computed from the specs
        cur[5] || r.cols[5], // keep hand-edited Comments
      ];
      updated++;
    }
  });

  await sheets.writeRange(TAB, 'A1:' + sheets.colLetter(HEADER.length) + (table.length + 1), [HEADER].concat(table));
  return { tab: TAB, added, updated, total: table.length };
}

module.exports = { sync, TAB, HEADER };
