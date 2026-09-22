// Custom Playwright reporter that streams live test events to the HIVE dashboard server.
// It runs inside the `playwright test` child process spawned by server/index.js, and
// posts each event back over HTTP to the server (which relays it to the browser via SSE).
// Every handler is defensive: a bad event should never crash the actual test run.

function post(payload) {
  try {
    const runId = process.env.HIVE_RUN_ID;
    const port = process.env.HIVE_SERVER_PORT;
    if (!runId || !port) return;
    fetch('http://127.0.0.1:' + port + '/internal/event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ runId, event: payload }),
    }).catch(() => {});
  } catch (e) {
    /* never let reporter errors affect the test run */
  }
}

function safeLocation(test) {
  try {
    return test.location || {};
  } catch (e) {
    return {};
  }
}

function safeProject(test) {
  try {
    if (test.parent && typeof test.parent.project === 'function') {
      const p = test.parent.project();
      if (p && p.name) return p.name;
    }
  } catch (e) {}
  try {
    const tp = test.titlePath();
    if (tp && tp[1]) return tp[1];
  } catch (e) {}
  return 'default';
}

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*m/g;
function stripAnsi(s) {
  return typeof s === 'string' ? s.replace(ANSI_RE, '') : s;
}

function pickError(result) {
  try {
    const e = (result.errors && result.errors[0]) || result.error;
    if (!e) return null;
    return {
      message: stripAnsi(e.message || String(e.value || 'Test failed')),
      stack: stripAnsi(e.stack || null),
    };
  } catch (e) {
    return null;
  }
}

function safeAnnotations(test) {
  try {
    return (test.annotations || []).map((a) => ({ type: a.type, description: a.description || null }));
  } catch (e) {
    return [];
  }
}

function safeTotal(suite) {
  try {
    return suite.allTests().length;
  } catch (e) {
    return 0;
  }
}

class HiveReporter {
  onBegin(config, suite) {
    post({ type: 'run-begin', total: safeTotal(suite) });
  }

  onTestBegin(test, result) {
    const loc = safeLocation(test);
    post({
      type: 'test-begin',
      file: loc.file,
      line: loc.line,
      title: test.title,
      project: safeProject(test),
    });
  }

  onTestEnd(test, result) {
    const loc = safeLocation(test);
    let steps = [];
    try {
      steps = (result.steps || [])
        .filter((s) => s.category === 'test.step')
        .map((s) => ({ title: s.title, error: !!s.error, duration: s.duration }));
    } catch (e) {}
    let attachments = [];
    try {
      attachments = (result.attachments || []).map((a) => ({
        name: a.name,
        path: a.path || null,
        contentType: a.contentType,
      }));
    } catch (e) {}
    post({
      type: 'test-end',
      file: loc.file,
      line: loc.line,
      title: test.title,
      project: safeProject(test),
      status: result.status,
      duration: result.duration,
      retry: result.retry,
      error: pickError(result),
      steps,
      attachments,
      annotations: safeAnnotations(test),
    });
  }

  // Deliberately no onEnd() handler here: Playwright still has to tear down browsers and
  // flush output after onEnd() fires, which happens before the child process actually
  // exits. The server treats its own child.on('exit', ...) as the authoritative "run
  // finished" signal (server/index.js finalizeRun) and emits the real 'run-end' SSE event
  // only once results are saved to disk — otherwise the dashboard can fetch results before
  // the run record exists yet.
}

module.exports = HiveReporter;
