const path = require('path');
const { spawnSync } = require('child_process');
const { getPlaywrightBin, playwrightInstalled } = require('./playwrightBin');

const ROOT = path.join(__dirname, '..');
const TEST_DIR = path.join(ROOT, 'test-cases');

// Playwright's --list JSON reports spec.file relative to testDir, but the reporter running
// inside the actual test process (server/reporter.js) reports TestCase.location.file as an
// absolute path. Resolve to absolute here so both sides key on the same string.
function resolveFile(file) {
  return path.isAbsolute(file) ? file : path.resolve(TEST_DIR, file);
}

function titleCaseFromFile(file) {
  const base = path.basename(file, path.extname(file)).replace(/\.spec$/i, '').replace(/\.test$/i, '');
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || base;
}

// Flattens a describe/suite node into a flat list of {id, title, file, line, tags}.
// Nested describes beyond the first level are folded into the case title as "Parent > Child".
// Playwright's --list JSON repeats each spec once per configured project (same file:line,
// different project in spec.tests[0]) — `seen` dedupes those down to one case per spec.
function walkInner(node, prefix, out, seen) {
  (node.specs || []).forEach((spec) => {
    const file = resolveFile(spec.file || node.file || '');
    const line = spec.line;
    const key = file + ':' + line;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      id: key,
      title: prefix ? prefix + ' > ' + spec.title : spec.title,
      file,
      line,
      tags: spec.tags || [],
    });
  });
  (node.suites || []).forEach((sub) => {
    walkInner(sub, prefix ? prefix + ' > ' + sub.title : sub.title, out, seen);
  });
}

// Turns a Playwright `--list --reporter=json` report into [{name, file, cases:[...]}].
//
// Grouping rule: a file with TWO OR MORE distinct top-level describe() blocks means the
// author deliberately split it into separate suites — each keeps its own describe title.
// Everything else (bare specs with no describe, or a single top-level describe wrapping a
// few related checks — both common when a project puts one test case per file) is grouped
// by the file's PARENT DIRECTORY instead of the individual file, so a feature folder full of
// one-file-per-case specs (login/, buzz/, ...) becomes one suite instead of dozens of
// one-case suites. A file sitting directly in testDir's root (no feature subfolder) falls
// back to a suite named after that file, since there's no folder to group it under.
function collectBareSpecs(fileSuite, bareSpecs, seen) {
  const cases = [];
  bareSpecs.forEach((spec) => {
    const file = resolveFile(spec.file || fileSuite.file);
    const key = file + ':' + spec.line;
    if (seen.has(key)) return;
    seen.add(key);
    cases.push({ id: key, title: spec.title, file, line: spec.line, tags: spec.tags || [] });
  });
  return cases;
}

function groupSuites(report) {
  const suites = [];
  const grouped = new Map(); // dirKey -> {name, file, cases}
  const fileSuites = (report && report.suites) || [];

  function addToGroup(fileSuite, cases) {
    if (!cases.length) return;
    const fileAbs = resolveFile(fileSuite.file);
    const dir = path.dirname(fileAbs);
    const inRoot = dir === TEST_DIR;
    const dirKey = inRoot ? 'file::' + fileAbs : 'dir::' + dir;
    const groupName = inRoot ? titleCaseFromFile(fileSuite.file || fileSuite.title || 'Tests') : titleCaseFromFile(path.basename(dir));
    if (!grouped.has(dirKey)) grouped.set(dirKey, { name: groupName, file: fileSuite.file, cases: [] });
    grouped.get(dirKey).cases.push(...cases);
  }

  fileSuites.forEach((fileSuite) => {
    const topDescribes = fileSuite.suites || [];
    const bareSpecs = fileSuite.specs || [];
    const seenInFile = new Set();

    if (topDescribes.length > 1) {
      topDescribes.forEach((describe) => {
        const cases = [];
        walkInner(describe, '', cases, seenInFile);
        if (cases.length) suites.push({ name: describe.title, file: fileSuite.file, cases });
      });
      addToGroup(fileSuite, collectBareSpecs(fileSuite, bareSpecs, seenInFile));
    } else {
      const cases = [];
      topDescribes.forEach((describe) => {
        walkInner(describe, describe.title, cases, seenInFile);
      });
      cases.push(...collectBareSpecs(fileSuite, bareSpecs, seenInFile));
      addToGroup(fileSuite, cases);
    }
  });

  grouped.forEach((suite) => suites.push(suite));
  return suites;
}

function listTests() {
  if (!playwrightInstalled()) {
    throw new Error(
      'Playwright is not installed yet. Run "npm install" then "npx playwright install" in the project folder.'
    );
  }
  const result = spawnSync(getPlaywrightBin(), ['test', '--list', '--reporter=json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 32,
  });
  if (result.error) {
    throw new Error('Could not run Playwright: ' + result.error.message);
  }
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch (e) {
    throw new Error(
      'Could not parse Playwright test list.\n' + (result.stderr || result.stdout || 'No output.')
    );
  }
  if (report.errors && report.errors.length) {
    throw new Error(report.errors.map((e) => e.message || JSON.stringify(e)).join('\n'));
  }
  return groupSuites(report);
}

module.exports = { listTests, groupSuites, titleCaseFromFile };
