// Minimal Google Sheets client for the dashboard. Authenticates as a service account (JWT
// bearer flow, signed with Node's own crypto) and talks to the Sheets v4 REST API with fetch,
// so it adds no npm dependency.
//
// Config (env vars, or a `.env` file in the project root):
//   GOOGLE_SHEET_ID               the long id between /d/ and /edit in the sheet URL
//   GOOGLE_SERVICE_ACCOUNT_FILE   path to the service-account key JSON (default server/google-key.json)
// The sheet must be shared (as Editor) with the service account's client_email.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

// Tiny .env loader — real environment variables always win.
(function loadDotEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!m || line.trim().startsWith('#')) return;
      const val = m[2].replace(/^(['"])(.*)\1$/, '$2');
      if (process.env[m[1]] === undefined) process.env[m[1]] = val;
    });
})();

function keyFilePath() {
  const p = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  return p ? path.resolve(ROOT, p) : path.join(__dirname, 'google-key.json');
}

// GOOGLE_SHEET_ID (env / .env) wins; otherwise the id saved in server/sheet-config.json.
function sheetId() {
  const fromEnv = (process.env.GOOGLE_SHEET_ID || '').trim();
  if (fromEnv) return fromEnv;
  try {
    return String(JSON.parse(fs.readFileSync(path.join(__dirname, 'sheet-config.json'), 'utf8')).sheetId || '').trim();
  } catch (e) {
    return '';
  }
}

function loadKey() {
  const file = keyFilePath();
  if (!fs.existsSync(file)) return null;
  try {
    const key = JSON.parse(fs.readFileSync(file, 'utf8'));
    return key.private_key && key.client_email ? key : null;
  } catch (e) {
    return null;
  }
}

/** What the dashboard needs to show setup instructions: never includes the key itself. */
function config() {
  const key = loadKey();
  return {
    configured: !!(sheetId() && key),
    hasSheetId: !!sheetId(),
    url: sheetId() ? 'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(sheetId()) + '/edit' : null,
    hasKey: !!key,
    serviceAccountEmail: key ? key.client_email : null,
    keyFile: path.relative(ROOT, keyFilePath()),
  };
}

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

let tokenCache = null; // { token, expiresAt }

async function accessToken() {
  if (tokenCache && tokenCache.expiresAt - 60000 > Date.now()) return tokenCache.token;
  const key = loadKey();
  if (!key) throw new Error('Google service-account key not found at ' + path.relative(ROOT, keyFilePath()));
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = key.token_uri || 'https://oauth2.googleapis.com/token';
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(
    JSON.stringify({
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    })
  );
  const sig = b64url(crypto.createSign('RSA-SHA256').update(head + '.' + claim).sign(key.private_key));
  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: head + '.' + claim + '.' + sig,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error('Google auth failed: ' + (data.error_description || data.error || res.status));
  }
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return tokenCache.token;
}

async function api(method, pathAndQuery, body) {
  if (!sheetId()) throw new Error('GOOGLE_SHEET_ID is not set');
  const url = 'https://sheets.googleapis.com/v4/spreadsheets/' + sheetId() + pathAndQuery;
  const res = await fetch(url, {
    method,
    headers: { Authorization: 'Bearer ' + (await accessToken()), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data.error && data.error.message) || 'Sheets API error ' + res.status);
    err.status = res.status;
    throw err;
  }
  return data;
}

function colLetter(n) {
  // 1 -> A, 27 -> AA
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

const quoteTab = (tab) => "'" + String(tab).replace(/'/g, "''") + "'";
const rangeParam = (tab, a1) => encodeURIComponent(quoteTab(tab) + (a1 ? '!' + a1 : ''));

async function listTabs() {
  const data = await api('GET', '?fields=sheets.properties.title');
  return (data.sheets || []).map((s) => s.properties.title);
}

async function ensureTab(title) {
  const tabs = await listTabs();
  if (tabs.indexOf(title) !== -1) return false;
  await api('POST', ':batchUpdate', { requests: [{ addSheet: { properties: { title } } }] });
  return true;
}

/** All values in a tab as an array of rows (ragged rows padded to the widest one). */
async function readTab(tab) {
  const data = await api('GET', '/values/' + rangeParam(tab));
  const rows = data.values || [];
  const width = rows.reduce((w, r) => Math.max(w, r.length), 0);
  return rows.map((r) => {
    const out = r.slice();
    while (out.length < width) out.push('');
    return out;
  });
}

// RAW so a value like "=SUM(...)" or "+123" is stored as literal text, never evaluated as a formula.
async function writeRange(tab, a1, values) {
  return api('PUT', '/values/' + rangeParam(tab, a1) + '?valueInputOption=RAW', { values });
}

async function writeCell(tab, row, col, value) {
  return writeRange(tab, colLetter(col) + row, [[value]]);
}

async function readCell(tab, row, col) {
  const a1 = colLetter(col) + row;
  const data = await api('GET', '/values/' + rangeParam(tab, a1));
  return data.values && data.values[0] && data.values[0][0] != null ? String(data.values[0][0]) : '';
}

async function appendRow(tab, values) {
  return api(
    'POST',
    '/values/' + rangeParam(tab) + ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',
    { values: [values] }
  );
}

module.exports = { config, listTabs, ensureTab, readTab, readCell, writeCell, writeRange, appendRow, colLetter };
