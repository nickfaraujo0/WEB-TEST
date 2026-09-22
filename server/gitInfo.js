const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEST_CASES_DIR = path.join(ROOT, 'test-cases');
const MAX_DIFF_BYTES = 300 * 1024;

// Read-only: only ever runs status / log / diff / show / rev-parse / config / rev-list.
// Arguments go straight to execFile (no shell) and every path is confined to test-cases/.
function git(args) {
  return new Promise((resolve) => {
    execFile('git', ['-c', 'core.quotepath=off'].concat(args), { cwd: ROOT, maxBuffer: 4 * 1024 * 1024, timeout: 15000 }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: stdout || '', stderr: stderr || '', missing: !!(err && err.code === 'ENOENT') });
    });
  });
}

// "https://github.com/o/r.git", "git@github.com:o/r.git" and "ssh://git@github.com/o/r" all
// become { slug: "o/r", webUrl: "https://github.com/o/r" }. Credentials embedded in the
// remote URL are never returned.
function parseRemote(url) {
  const m = String(url || '').trim().match(/github\.com[:/]+([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i);
  if (!m) return { slug: null, webUrl: null };
  return { slug: m[1] + '/' + m[2], webUrl: 'https://github.com/' + m[1] + '/' + m[2] };
}

// Turns a file path from the dashboard (absolute, as /api/tests reports it) into a
// repo-relative path, or null if it is not inside test-cases/.
function toRepoRel(file) {
  if (!file) return null;
  const resolved = path.resolve(ROOT, file);
  if (!resolved.startsWith(TEST_CASES_DIR + path.sep)) return null;
  return path.relative(ROOT, resolved).split(path.sep).join('/');
}

async function repoState() {
  const top = await git(['rev-parse', '--show-toplevel']);
  if (top.missing) return { available: false, reason: 'git is not installed here.' };
  if (!top.ok) return { available: false, reason: 'This folder is not a git repository.' };
  let real;
  try {
    real = fs.realpathSync(ROOT);
  } catch (e) {
    real = ROOT;
  }
  if (path.resolve(top.stdout.trim()) !== real) return { available: false, reason: 'The dashboard is not at the root of its git repository.' };
  return { available: true };
}

function parseStatus(raw) {
  const files = {};
  const parts = raw.split('\0');
  for (let i = 0; i < parts.length; i++) {
    const rec = parts[i];
    if (rec.length < 4) continue;
    const xy = rec.slice(0, 2);
    const file = rec.slice(3);
    let status = 'modified';
    if (xy === '??' || xy.indexOf('A') !== -1) status = 'new';
    else if (xy.indexOf('D') !== -1) status = 'deleted';
    else if (xy.indexOf('R') !== -1) {
      status = 'renamed';
      i++; // the next record is the old name
    }
    files[file] = status;
  }
  return files;
}

async function status() {
  const state = await repoState();
  if (!state.available) return Object.assign({ files: {} }, state);

  const [branch, head, remote, counts, st] = await Promise.all([
    git(['rev-parse', '--abbrev-ref', 'HEAD']),
    git(['rev-parse', '--short', 'HEAD']),
    git(['config', '--get', 'remote.origin.url']),
    git(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']),
    git(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', 'test-cases']),
  ]);

  let ahead = null;
  let behind = null;
  if (counts.ok) {
    const n = counts.stdout.trim().split(/\s+/).map(Number);
    ahead = n[0];
    behind = n[1];
  }
  const repo = parseRemote(remote.stdout);
  return {
    available: true,
    branch: branch.ok ? branch.stdout.trim() : null,
    head: head.ok ? head.stdout.trim() : null,
    slug: repo.slug,
    webUrl: repo.webUrl,
    ahead,
    behind,
    files: st.ok ? parseStatus(st.stdout) : {},
  };
}

async function history(file) {
  const rel = toRepoRel(file);
  if (!rel) return { error: 'File is outside test-cases/', status: 403 };
  const state = await repoState();
  if (!state.available) return { error: state.reason, status: 503 };
  const log = await git(['log', '--follow', '-n', '30', '--format=%H%x1f%h%x1f%an%x1f%aI%x1f%s', '--', rel]);
  const commits = log.ok
    ? log.stdout
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const f = line.split('\x1f');
          return { sha: f[0], short: f[1], author: f[2], date: f[3], subject: f[4] };
        })
    : [];
  return { rel, commits };
}

// With `commit`: what that commit changed in the file. Without: uncommitted changes vs HEAD.
async function diff(file, commit) {
  const rel = toRepoRel(file);
  if (!rel) return { error: 'File is outside test-cases/', status: 403 };
  if (commit && !/^[0-9a-f]{7,40}$/i.test(commit)) return { error: 'Invalid commit id', status: 400 };
  const state = await repoState();
  if (!state.available) return { error: state.reason, status: 503 };

  let result;
  if (commit) {
    result = await git(['show', '--no-color', '--format=', commit, '--', rel]);
  } else {
    const st = await git(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', rel]);
    if (st.ok && st.stdout.startsWith('??')) return { rel, text: '', untracked: true };
    result = await git(['diff', '--no-color', 'HEAD', '--', rel]);
  }
  if (!result.ok) return { error: 'Could not read the diff.', status: 500 };
  const truncated = Buffer.byteLength(result.stdout) > MAX_DIFF_BYTES;
  return { rel, text: truncated ? result.stdout.slice(0, MAX_DIFF_BYTES) : result.stdout, truncated };
}

module.exports = { status, history, diff };
