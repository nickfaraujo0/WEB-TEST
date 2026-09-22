// Turns a raw Playwright result (status + error + annotations) into short, human-readable
// labels the dashboard can show inline — a status badge alone doesn't say whether a "failed"
// test timed out, failed an assertion, or hit a network error, or why a "skipped" test was
// skipped in the first place.

function classifyFailure(status, error) {
  if (status === 'timedOut') return 'Timeout';
  if (status === 'interrupted') return 'Interrupted';
  if (status !== 'failed') return null;

  const msg = (error && error.message) || '';
  if (/timeout\s+\d+ms\s+exceeded/i.test(msg)) return 'Timeout';
  if (/^error: expect\(|(?:^|\s)expect\(.*\)\.(?:not\.)?to/i.test(msg)) return 'Assertion';
  if (/net::ERR_|NS_ERROR_|ECONNREFUSED|ENOTFOUND|ERR_CONNECTION|getaddrinfo/i.test(msg)) return 'Network';
  return 'Error';
}

// Playwright folds runtime annotations (test.skip()/fixme() calls, including ones made
// inside the test body) into the TestCase's own `annotations` array after it finishes.
function skipReason(annotations) {
  if (!Array.isArray(annotations)) return null;
  const a = annotations.find((x) => x && (x.type === 'skip' || x.type === 'fixme') && x.description);
  return a ? a.description : null;
}

module.exports = { classifyFailure, skipReason };
