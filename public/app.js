(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Theme toggle (light / dark, persisted)
  // ---------------------------------------------------------------------
  (function () {
    var root = document.documentElement;
    var toggle = document.getElementById('theme-toggle');
    var sun = toggle.querySelector('.i-sun');
    var moon = toggle.querySelector('.i-moon');
    function effectiveTheme() {
      var explicit = root.getAttribute('data-theme');
      if (explicit) return explicit;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function paintIcon() {
      var t = effectiveTheme();
      sun.hidden = t !== 'dark';
      moon.hidden = t === 'dark';
    }
    try {
      var saved = localStorage.getItem('hiveTheme');
      if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
    } catch (e) {}
    paintIcon();
    toggle.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('hiveTheme', next);
      } catch (e) {}
      paintIcon();
    });
  })();

  // ---------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------
  function $(id) {
    return document.getElementById(id);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function truncate(s, n) {
    s = String(s || '').split('\n')[0];
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }
  var BROWSER_META = {
    chromium: {
      label: 'Chromium',
      icon:
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/></svg>',
    },
    firefox: {
      label: 'Firefox',
      icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8.5"/></svg>',
    },
    webkit: {
      label: 'WebKit',
      icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="3"/></svg>',
    },
  };
  var ENV_URLS = {
    local: 'https://hive-dev.thegritcity.com',
    staging: 'https://staging.hive-app.dev',
    production: 'https://hive-app.dev',
  };
  function bchip(browserKey) {
    var meta = BROWSER_META[(browserKey || '').toLowerCase()] || { label: browserKey, icon: '' };
    return '<span class="browser-chip">' + meta.icon + meta.label + '</span>';
  }
  function statusClass(status) {
    if (status === 'passed') return 'pass';
    if (status === 'skipped') return 'skip';
    if (status === 'failed' || status === 'timedOut' || status === 'interrupted') return 'fail';
    return status || 'queued';
  }
  function badge(status) {
    var cls = statusClass(status);
    var label = { pass: 'Passed', fail: 'Failed', skip: 'Skipped', running: 'Running', queued: 'Queued' }[cls] || cls;
    return '<span class="badge ' + cls + '"><span class="dot"></span>' + label + '</span>';
  }
  function fmtDuration(ms) {
    if (ms == null) return '—';
    if (ms < 1000) return ms + 'ms';
    var s = ms / 1000;
    if (s < 60) return s.toFixed(1) + 's';
    var m = Math.floor(s / 60);
    var rem = Math.round(s % 60);
    return m + 'm ' + rem + 's';
  }
  function fmtWhen(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    var diffMs = Date.now() - d.getTime();
    var mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' min ago';
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + ' hr ago';
    var days = Math.round(hrs / 24);
    if (days === 1) return 'yesterday';
    return days + ' days ago';
  }
  function shortId(id) {
    return '#' + String(id || '').slice(-6);
  }

  // ---------------------------------------------------------------------
  // Nav / view switching
  // ---------------------------------------------------------------------
  var VIEWS = ['overview', 'cases', 'runs', 'live', 'results', 'reports', 'bugs', 'settings'];
  function showView(v) {
    VIEWS.forEach(function (name) {
      $('view-' + name).hidden = name !== v;
    });
    document.querySelectorAll('.navitem').forEach(function (el) {
      el.classList.toggle('active', el.dataset.view === v);
    });
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('[data-view]').forEach(function (el) {
    el.addEventListener('click', function () {
      showView(el.dataset.view);
    });
  });

  // ---------------------------------------------------------------------
  // Global state
  // ---------------------------------------------------------------------
  var STATE = {
    suites: [],
    testsById: {}, // "file:line" -> {title, suite, file, line, tags}
    checked: {},
    suiteOpen: {},
    browsersOn: { chromium: true, firefox: true, webkit: false },
    env: 'local',
    mode: 'headless',
    workers: 4,
    retries: true,
    parallel: true,
    historyRuns: [],
    testHistory: {}, // "file:line" -> {file,line,title,suite,lastRunAt,byProject,history}
    latestRun: null,
    resultsRun: null,
    resultsFilters: { status: '', browser: '', suite: '', q: '' },
    currentRunId: null,
    liveCaseList: [],
    liveBrowsers: [],
    liveColState: {},
    es: null,
    elapsedTimer: null,
    elapsedStart: null,
  };

  // ---------------------------------------------------------------------
  // Test discovery + suite tree (Test Runs page)
  // ---------------------------------------------------------------------
  function loadTests() {
    return fetch('/api/tests')
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        STATE.suites = data.suites || [];
        STATE.testsById = {};
        STATE.checked = {};
        STATE.suiteOpen = {};
        var total = 0;
        STATE.suites.forEach(function (s) {
          STATE.suiteOpen[s.name] = false;
          s.cases.forEach(function (c) {
            STATE.testsById[c.id] = { title: c.title, suite: s.name, file: c.file, line: c.line, tags: c.tags || [] };
            STATE.checked[c.id] = true;
            total++;
          });
        });

        $('nav-test-count').textContent = String(total);
        $('cases-count-sub').textContent = total + ' Playwright spec' + (total === 1 ? '' : 's') + ' across ' + STATE.suites.length + ' suite' + (STATE.suites.length === 1 ? '' : 's');

        var noTests = total === 0;
        var msg = data.error
          ? '<div class="alert-banner">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/></svg>' +
            esc(data.error) +
            '</div>'
          : '<div class="live-col-empty">No tests found in test-cases/. Add a .spec.js or .spec.ts file and reload.</div>';
        $('suite-tree').innerHTML = noTests ? msg : '';

        populateSuiteFilters();
        buildTree('');
        updateSummary();
        buildCaseTree('');
      })
      .catch(function (e) {
        $('suite-tree').innerHTML =
          '<div class="alert-banner"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/></svg>Could not reach the HIVE server: ' +
          esc(e.message) +
          '</div>';
      });
  }

  function populateSuiteFilters() {
    var names = STATE.suites.map(function (s) {
      return s.name;
    });
    [
      { id: 'results-suite-filter', keep: '' },
    ].forEach(function (cfg) {
      var el = $(cfg.id);
      var current = el.value;
      el.innerHTML = '<option value="">All suites</option>' + names.map(function (n) {
        return '<option>' + esc(n) + '</option>';
      }).join('');
      if (names.indexOf(current) >= 0) el.value = current;
    });
  }

  function buildTree(filter) {
    var html = STATE.suites
      .map(function (s) {
        var visibleCases = s.cases.filter(function (c) {
          return !filter || c.title.toLowerCase().indexOf(filter.toLowerCase()) >= 0;
        });
        if (filter && visibleCases.length === 0) return '';
        var allOn = s.cases.every(function (c) {
          return STATE.checked[c.id];
        });
        var isOpen = filter ? true : !!STATE.suiteOpen[s.name];
        var caseHtml = visibleCases
          .map(function (c) {
            var on = !!STATE.checked[c.id];
            return (
              '<label class="case-row ' + (on ? 'on' : '') + '" data-key="' + esc(c.id) + '">' +
              '<input type="checkbox" ' + (on ? 'checked' : '') + ' data-case-key="' + esc(c.id) + '">' +
              '<span class="cn">' + esc(c.title) + '</span></label>'
            );
          })
          .join('');
        return (
          '<div class="suite" data-suite="' + esc(s.name) + '">' +
          '<div class="suite-head' + (isOpen ? ' open' : '') + '" data-suite-toggle="' + esc(s.name) + '">' +
          '<svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 6l6 6-6 6"/></svg>' +
          '<span class="name">' + esc(s.name) + '</span><span class="cnt">(' + s.cases.length + ')</span>' +
          '<span class="spacer"></span>' +
          '<button type="button" class="suite-select-all' + (allOn ? ' all-on' : '') + '" data-suite-select="' + esc(s.name) + '">' + (allOn ? 'Clear all' : 'Select all') + '</button>' +
          '</div>' +
          '<div class="cases" style="display:' + (isOpen ? 'flex' : 'none') + ';">' + caseHtml + '</div></div>'
        );
      })
      .join('');
    $('suite-tree').innerHTML = html;
    wireTree();
  }

  function wireTree() {
    document.querySelectorAll('[data-suite-toggle]').forEach(function (h) {
      h.addEventListener('click', function (e) {
        if (e.target.closest('[data-suite-select]')) return;
        var name = h.dataset.suiteToggle;
        STATE.suiteOpen[name] = !STATE.suiteOpen[name];
        buildTree($('suite-search').value);
      });
    });
    document.querySelectorAll('[data-suite-select]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var suiteName = btn.dataset.suiteSelect;
        var suite = STATE.suites.find(function (s) {
          return s.name === suiteName;
        });
        var allOn = suite.cases.every(function (c) {
          return STATE.checked[c.id];
        });
        suite.cases.forEach(function (c) {
          STATE.checked[c.id] = !allOn;
        });
        buildTree($('suite-search').value);
        updateSummary();
      });
    });
    document.querySelectorAll('[data-case-key]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        STATE.checked[cb.dataset.caseKey] = cb.checked;
        cb.closest('.case-row').classList.toggle('on', cb.checked);
        var suiteName = cb.closest('.suite').dataset.suite;
        var suite = STATE.suites.find(function (s) {
          return s.name === suiteName;
        });
        var allOn = suite.cases.every(function (c) {
          return STATE.checked[c.id];
        });
        var suiteBtn = document.querySelector('[data-suite-select="' + CSS.escape(suiteName) + '"]');
        if (suiteBtn) {
          suiteBtn.textContent = allOn ? 'Clear all' : 'Select all';
          suiteBtn.classList.toggle('all-on', allOn);
        }
        updateSummary();
      });
    });
  }

  $('suite-search').addEventListener('input', function (e) {
    buildTree(e.target.value);
  });
  $('select-all').addEventListener('change', function (e) {
    Object.keys(STATE.testsById).forEach(function (k) {
      STATE.checked[k] = e.target.checked;
    });
    buildTree($('suite-search').value);
    updateSummary();
  });

  // ---------------------------------------------------------------------
  // Browsers / environment / mode / workers / toggles
  // ---------------------------------------------------------------------
  document.querySelectorAll('.chip-check').forEach(function (chip) {
    chip.addEventListener('click', function (e) {
      e.preventDefault();
      var key = chip.dataset.browser;
      STATE.browsersOn[key] = !STATE.browsersOn[key];
      chip.classList.toggle('on', STATE.browsersOn[key]);
      chip.querySelector('input').checked = STATE.browsersOn[key];
      updateSummary();
    });
  });

  document.querySelectorAll('.env-card').forEach(function (card) {
    card.addEventListener('click', function () {
      document.querySelectorAll('.env-card').forEach(function (c) {
        c.classList.remove('on');
      });
      card.classList.add('on');
      STATE.env = card.dataset.env;
      $('rp-env').textContent = card.querySelector('.name').textContent;
    });
  });

  document.querySelectorAll('#mode-seg button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#mode-seg button').forEach(function (x) {
        x.classList.remove('on');
      });
      b.classList.add('on');
      STATE.mode = b.dataset.mode;
      $('rp-mode').textContent = b.textContent;
    });
  });
  $('workers-select').addEventListener('change', function (e) {
    var v = e.target.value;
    STATE.workers = v.indexOf('1') === 0 ? 1 : parseInt(v, 10) || 1;
    $('rp-workers').textContent = String(STATE.workers);
  });
  document.querySelectorAll('.switch').forEach(function (sw) {
    sw.addEventListener('click', function () {
      sw.classList.toggle('on');
      if (sw.dataset.toggle === 'retry') STATE.retries = sw.classList.contains('on');
      if (sw.dataset.toggle === 'parallel') STATE.parallel = sw.classList.contains('on');
    });
  });

  function updateSummary() {
    var n = Object.keys(STATE.checked).filter(function (k) {
      return STATE.checked[k];
    }).length;
    var bcount = Object.keys(STATE.browsersOn).filter(function (k) {
      return STATE.browsersOn[k];
    }).length;
    $('sum-cases').textContent = n;
    $('sum-browsers').textContent = bcount;
    $('sum-exec').textContent = n * bcount;
    $('sum-cases-chip').textContent = n + ' selected';
    $('sum-browsers-chip').textContent = bcount + ' selected';
    $('cases-warning').hidden = n !== 0;
    $('browsers-warning').hidden = bcount !== 0;
    $('run-btn').disabled = n === 0 || bcount === 0;
  }

  // ---------------------------------------------------------------------
  // Test Cases page
  // ---------------------------------------------------------------------
  // The single most recent point across all browsers for one test — used for the Test
  // Cases table's "last status"/"duration"/"last run" columns, which don't distinguish
  // browsers (the history drawer does).
  function mostRecentPoint(historyEntry) {
    if (!historyEntry) return null;
    var last = null;
    Object.keys(historyEntry.byProject).forEach(function (p) {
      var pt = historyEntry.byProject[p];
      if (!last || pt.finishedAt > last.finishedAt) last = pt;
    });
    return last;
  }
  // ---------------------------------------------------------------------
  // Test Cases page — collapsible suite tree + VSCode-style read-only source viewer
  // ---------------------------------------------------------------------
  STATE.caseTreeOpen = STATE.caseTreeOpen || {};
  STATE.activeCaseId = null;

  function buildCaseTree(filterText) {
    var q = (filterText || '').toLowerCase();
    var html = STATE.suites
      .map(function (s) {
        var visible = s.cases.filter(function (c) {
          return !q || c.title.toLowerCase().indexOf(q) >= 0 || s.name.toLowerCase().indexOf(q) >= 0;
        });
        if (!visible.length) return '';
        var isOpen = q ? true : STATE.caseTreeOpen[s.name] !== false; // default open
        var items = visible
          .map(function (c) {
            return (
              '<button type="button" class="case-tree-item' + (STATE.activeCaseId === c.id ? ' active' : '') + '" data-case-id="' + esc(c.id) + '" title="' + esc(c.title) + '">' +
              gitDot(c) + esc(c.title) + '</button>'
            );
          })
          .join('');
        return (
          '<div class="suite" data-suite="' + esc(s.name) + '">' +
          '<div class="suite-head' + (isOpen ? ' open' : '') + '" data-case-suite-toggle="' + esc(s.name) + '">' +
          '<svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M9 6l6 6-6 6"/></svg>' +
          '<span class="name">' + esc(s.name) + '</span><span class="cnt">(' + visible.length + ')</span>' +
          '</div>' +
          '<div style="display:' + (isOpen ? 'block' : 'none') + ';">' + items + '</div></div>'
        );
      })
      .join('');
    $('cases-tree').innerHTML = html || '<div class="live-col-empty">No test cases match.</div>';

    document.querySelectorAll('[data-case-suite-toggle]').forEach(function (h) {
      h.addEventListener('click', function () {
        var name = h.dataset.caseSuiteToggle;
        STATE.caseTreeOpen[name] = !(STATE.caseTreeOpen[name] !== false);
        buildCaseTree($('cases-search').value);
      });
    });
    document.querySelectorAll('[data-case-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openCaseSource(btn.dataset.caseId);
      });
    });
  }

  function openCaseSource(caseId) {
    var c = STATE.testsById[caseId];
    if (!c) return;
    STATE.activeCaseId = caseId;
    document.querySelectorAll('.case-tree-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.caseId === caseId);
    });

    var entry = STATE.testHistory[caseId];
    var last = mostRecentPoint(entry);
    var fileName = c.file.split('/').pop();
    $('cases-viewer-tab').innerHTML =
      '<span class="file">' + esc(fileName) + '</span>' +
      '<span>' + esc(c.suite || '') + '</span>' +
      (last ? badge(last.status) : '<span style="color:var(--text-faint);">Not run</span>') +
      '<button type="button" class="hist-link" id="cases-view-history">View history</button>';
    $('cases-view-history').addEventListener('click', function () {
      openHistoryDrawer(caseId);
    });

    STATE.caseMode = 'source';
    STATE.caseSourceHtml = '';
    renderGitStrip();
    $('cases-viewer-body').innerHTML = '<div class="live-col-empty">Loading…</div>';
    fetch('/api/source?file=' + encodeURIComponent(c.file))
      .then(function (r) {
        if (!r.ok) throw new Error('Could not read file (' + r.status + ')');
        return r.json();
      })
      .then(function (data) {
        if (STATE.activeCaseId !== caseId) return;
        var lines = data.content.replace(/\r\n/g, '\n').split('\n');
        STATE.caseSourceHtml = lines
          .map(function (line, i) {
            return '<div class="code-line"><span class="ln">' + (i + 1) + '</span><span class="lc">' + esc(line) + '</span></div>';
          })
          .join('');
        if (STATE.caseMode === 'source') $('cases-viewer-body').innerHTML = STATE.caseSourceHtml;
      })
      .catch(function (e) {
        if (STATE.activeCaseId !== caseId) return;
        $('cases-viewer-body').innerHTML = '<div class="alert-banner">Could not load source: ' + esc(e.message) + '</div>';
      });
  }

  $('cases-search').addEventListener('input', function (e) {
    buildCaseTree(e.target.value);
  });
  $('cases-collapse-btn').addEventListener('click', function () {
    $('cases-sidebar').classList.toggle('collapsed');
  });

  // ---------------------------------------------------------------------
  // Run a test: POST /api/run, then drive the live 3-column board via SSE
  // ---------------------------------------------------------------------
  $('run-btn').addEventListener('click', function () {
    var tests = Object.keys(STATE.checked)
      .filter(function (k) {
        return STATE.checked[k];
      })
      .map(function (k) {
        var t = STATE.testsById[k];
        return { file: t.file, line: t.line, title: t.title, suite: t.suite };
      });
    var browsers = Object.keys(STATE.browsersOn).filter(function (k) {
      return STATE.browsersOn[k];
    });
    if (!tests.length || !browsers.length) return;

    var body = {
      tests: tests,
      browsers: browsers,
      workers: STATE.workers,
      mode: STATE.mode,
      retries: STATE.retries,
      parallel: STATE.parallel,
      environment: STATE.env,
      baseUrl: ENV_URLS[STATE.env] || '',
    };

    fetch('/api/run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.error || 'Could not start the run.');
          return data;
        });
      })
      .then(function (data) {
        startLiveBoard(tests, browsers, data.runId, true);
      })
      .catch(function (e) {
        alert(e.message);
      });
  });

  $('cancel-btn').addEventListener('click', function () {
    fetch('/api/cancel', { method: 'POST' }).catch(function () {});
  });

  function buildLiveColumns(browsers, caseList) {
    var order = ['chromium', 'firefox', 'webkit'];
    var html = order
      .map(function (bkey) {
        var meta = BROWSER_META[bkey];
        var isActive = browsers.indexOf(bkey) >= 0;
        if (!isActive) {
          return (
            '<div class="live-col inactive" data-browser="' + bkey + '">' +
            '<div class="live-col-head"><div class="b-row">' + meta.icon + '<span class="b-name">' + meta.label + '</span></div></div>' +
            '<div class="live-col-empty"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg><div>Not selected for this run</div></div></div>'
          );
        }
        var rows = caseList
          .map(function (c) {
            var key = c.file + ':' + c.line;
            return (
              '<div class="live-test-row queued" data-browser="' + bkey + '" data-key="' + esc(key) + '">' +
              '<div class="si queued">•</div><div class="body"><div class="nm">' + esc(c.title) + '</div><div class="suite-tag">' + esc(c.suite || '') + '</div></div>' +
              '<div class="du">—</div></div>'
            );
          })
          .join('');
        return (
          '<div class="live-col" data-browser="' + bkey + '">' +
          '<div class="live-col-head"><div class="b-row">' + meta.icon + '<span class="b-name">' + meta.label + '</span><span class="b-count" data-count>0 / ' + caseList.length + '</span></div>' +
          '<div class="live-col-track"><div class="live-col-fill" data-fill style="width:0%;"></div></div></div>' +
          '<div class="live-shot" data-shot>' +
          '<div class="live-shot-empty" data-shot-empty>Waiting for a screenshot…</div>' +
          '<img data-shot-img hidden>' +
          '</div>' +
          '<div class="live-col-body" data-body>' + rows + '</div></div>'
        );
      })
      .join('');
    $('live-cols').innerHTML = html;
  }

  function markRunning(row) {
    if (!row) return;
    row.classList.remove('queued');
    row.classList.add('running');
    row.querySelector('.si').className = 'si running';
  }

  function findLiveRow(browser, file, line) {
    var col = document.querySelector('.live-col[data-browser="' + browser + '"]');
    if (!col) return null;
    return col.querySelector('.live-test-row[data-key="' + CSS.escape(file + ':' + line) + '"]');
  }

  function updateOverallStats() {
    var pass = 0,
      fail = 0,
      skip = 0,
      done = 0,
      running = 0;
    Object.keys(STATE.liveColState).forEach(function (b) {
      var st = STATE.liveColState[b];
      pass += st.pass;
      fail += st.fail;
      skip += st.skip;
      done += st.pass + st.fail + st.skip;
      running += st.running;
    });
    var total = STATE.liveCaseList.length * STATE.liveBrowsers.length;
    $('live-pass').textContent = pass;
    $('live-fail').textContent = fail + skip;
    $('live-running-n').textContent = running;
    $('live-queued').textContent = Math.max(total - done - running, 0);
    $('live-progress-label').textContent = 'Running ' + done + ' / ' + total + ' executions';
    $('progress-fill').style.width = total ? (done / total) * 100 + '%' : '0%';
    return { pass: pass, fail: fail + skip, done: done, total: total };
  }

  function handleLiveEvent(ev) {
    if (ev.type === 'test-begin') {
      var row = findLiveRow(ev.project, ev.file, ev.line);
      if (row && row.classList.contains('queued')) {
        markRunning(row);
        var st = STATE.liveColState[ev.project];
        if (st) st.running++;
        updateOverallStats();
      }
    } else if (ev.type === 'test-end') {
      var row2 = findLiveRow(ev.project, ev.file, ev.line);
      // SSE reconnects (e.g. after a brief network hiccup mid-run) replay the full event
      // history for that run, and a page reload resumes by replaying it too — so the same
      // test-end can legitimately arrive twice. A row already in a terminal state (not
      // "queued" or "running" any more) means it was already counted; skip it.
      if (row2 && !row2.classList.contains('queued') && !row2.classList.contains('running')) {
        return;
      }
      var st2 = STATE.liveColState[ev.project];
      if (row2) {
        row2.classList.remove('running', 'queued');
        var cls = statusClass(ev.status);
        row2.querySelector('.si').className = 'si ' + cls;
        row2.querySelector('.du').textContent = fmtDuration(ev.duration);
      }
      if (st2) {
        if (st2.running > 0) st2.running--;
        if (ev.status === 'passed') st2.pass++;
        else if (ev.status === 'skipped') st2.skip++;
        else st2.fail++;
        var col = document.querySelector('.live-col[data-browser="' + ev.project + '"]');
        if (col) {
          var doneN = st2.pass + st2.fail + st2.skip;
          col.querySelector('[data-count]').textContent = doneN + ' / ' + STATE.liveCaseList.length;
          col.querySelector('[data-fill]').style.width = (doneN / STATE.liveCaseList.length) * 100 + '%';
        }
      }
      updateOverallStats();
    } else if (ev.type === 'run-end') {
      finishLiveRun(ev);
    } else if (ev.type === 'run-error') {
      alert('Run error: ' + ev.message);
    } else if (ev.type === 'frame') {
      applyFrame(ev.project, ev.image);
    }
  }

  function applyFrame(project, imageBase64) {
    var col = document.querySelector('.live-col[data-browser="' + project + '"]');
    if (!col) return;
    var img = col.querySelector('[data-shot-img]');
    var empty = col.querySelector('[data-shot-empty]');
    if (!img) return;
    img.src = 'data:image/jpeg;base64,' + imageBase64;
    img.hidden = false;
    if (empty) empty.hidden = true;
  }

  function startLiveBoard(caseList, browsers, runId, isFresh) {
    STATE.currentRunId = runId;
    $('run-btn').disabled = true;
    STATE.liveCaseList = caseList;
    STATE.liveBrowsers = browsers;
    STATE.liveColState = {};
    browsers.forEach(function (b) {
      STATE.liveColState[b] = { pass: 0, fail: 0, skip: 0, running: 0 };
    });

    $('live-nav-dot').hidden = false;
    $('cancel-btn').hidden = false;
    $('live-idle').hidden = true;
    $('live-active').hidden = false;
    $('live-complete-panel').hidden = true;
    $('live-title').textContent = 'Live Run ' + shortId(runId);
    $('live-sub').textContent = caseList.length + ' test cases · ' + browsers.length + ' browsers · ' + caseList.length * browsers.length + ' executions';

    buildLiveColumns(browsers, caseList);
    updateOverallStats();

    if (isFresh) showView('live');

    clearInterval(STATE.elapsedTimer);
    STATE.elapsedStart = Date.now();
    $('live-elapsed').textContent = '00:00';
    STATE.elapsedTimer = setInterval(function () {
      var s = Math.floor((Date.now() - STATE.elapsedStart) / 1000);
      var m = String(Math.floor(s / 60)).padStart(2, '0');
      var ss = String(s % 60).padStart(2, '0');
      $('live-elapsed').textContent = m + ':' + ss;
    }, 1000);

    if (STATE.es) STATE.es.close();
    STATE.es = new EventSource('/api/stream?runId=' + encodeURIComponent(runId));
    STATE.es.onmessage = function (msg) {
      try {
        handleLiveEvent(JSON.parse(msg.data));
      } catch (e) {}
    };
  }

  function finishLiveRun(ev) {
    clearInterval(STATE.elapsedTimer);
    if (STATE.es) {
      STATE.es.close();
      STATE.es = null;
    }
    $('live-nav-dot').hidden = true;
    $('cancel-btn').hidden = true;

    fetch('/api/results/' + encodeURIComponent(STATE.currentRunId))
      .then(function (r) {
        return r.json();
      })
      .then(function (run) {
        STATE.latestRun = run;
        $('live-complete-panel').hidden = false;
        $('complete-title').textContent = (run.status === 'cancelled' ? 'Run ' : 'Run ') + shortId(run.id) + (run.status === 'cancelled' ? ' cancelled' : ' complete');
        $('complete-sub').textContent = 'Finished in ' + fmtDuration(run.durationMs) + ' · ' + run.browsers.map(function (b) {
          return BROWSER_META[b] ? BROWSER_META[b].label : b;
        }).join(', ');
        $('complete-total').textContent = run.executions;
        $('complete-pass').textContent = run.stats.passed;
        $('complete-fail').textContent = run.stats.failed;

        loadHistory();
        loadTestHistory().then(function () {
          buildCaseTree($('cases-search').value);
          if (STATE.activeCaseId) openCaseSource(STATE.activeCaseId);
        });
      })
      .catch(function () {})
      .then(function () {
        STATE.currentRunId = null;
        updateSummary();
      });
  }

  // Resume a run already in progress (e.g. after a page reload).
  function resumeIfActive() {
    fetch('/api/status')
      .then(function (r) {
        return r.json();
      })
      .then(function (status) {
        // A fresh run-btn click may have already started its own live board (and its own
        // EventSource) while this page-load status check was still in flight — don't start
        // a second one for the same run, or every event would be double-counted.
        if (!status.active || STATE.currentRunId) return;
        startLiveBoard(status.tests, status.browsers, status.runId, false);
        (status.events || []).forEach(handleLiveEvent);
        Object.keys(status.lastFrame || {}).forEach(function (project) {
          applyFrame(project, status.lastFrame[project]);
        });
      })
      .catch(function () {});
  }

  // ---------------------------------------------------------------------
  // Overview + history
  // ---------------------------------------------------------------------
  function loadHistory() {
    return fetch('/api/history')
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        STATE.historyRuns = data.runs || [];
        renderOverview();
        populateResultsRunSelect();
        if (STATE.historyRuns.length && !STATE.resultsRun) {
          loadResultsRun(STATE.historyRuns[0].id);
        }
      });
  }

  function renderOverview() {
    var totalCases = 0;
    STATE.suites.forEach(function (s) {
      totalCases += s.cases.length;
    });
    $('kpi-cases').textContent = totalCases;
    $('kpi-cases-sub').textContent = STATE.suites.length + ' suite' + (STATE.suites.length === 1 ? '' : 's');

    var latest = STATE.historyRuns[0];
    if (latest) {
      $('kpi-passed').textContent = latest.stats.passed;
      $('kpi-failed').textContent = latest.stats.failed;
      $('kpi-skipped').textContent = latest.stats.skipped;
      var total = latest.stats.passed + latest.stats.failed;
      $('kpi-passrate').textContent = total ? Math.round((latest.stats.passed / total) * 1000) / 10 + '%' : '—';
      $('kpi-avgtime').textContent = latest.avgTestMs ? fmtDuration(latest.avgTestMs) : '—';
      $('kpi-latest').textContent = shortId(latest.id);
      $('kpi-latest-sub').textContent = fmtWhen(latest.finishedAt);

      var ratio = latest.stats.passed + '/' + (latest.stats.passed + latest.stats.failed + latest.stats.skipped);
      $('sb-ratio').textContent = ratio;
      var denom = latest.stats.passed + latest.stats.failed + latest.stats.skipped;
      $('sb-fill').style.width = (denom ? (latest.stats.passed / denom) * 100 : 0) + '%';
      $('sb-failed').textContent = latest.stats.failed;
      $('sb-skipped').textContent = latest.stats.skipped;
    } else {
      ['kpi-passed', 'kpi-failed', 'kpi-skipped', 'kpi-passrate', 'kpi-avgtime', 'kpi-latest'].forEach(function (id) {
        $(id).textContent = '—';
      });
      $('kpi-latest-sub').textContent = 'No runs yet';
    }

    $('runs-table').innerHTML =
      STATE.historyRuns
        .map(function (r) {
          return (
            '<tr><td class="cell-id">' + shortId(r.id) + '</td><td class="cell-name">' + r.totalCases + ' cases</td><td>' +
            r.browsers.map(bchip).join(' ') +
            '</td><td class="mono">' + r.executions + '</td>' +
            '<td class="mono" style="color:var(--success);">' + r.stats.passed + '</td>' +
            '<td class="mono" style="color:' + (r.stats.failed ? 'var(--danger)' : 'var(--text-faint)') + ';">' + r.stats.failed + '</td>' +
            '<td class="mono">' + fmtDuration(r.durationMs) + '</td><td>' + badge(r.status === 'passed' ? 'passed' : r.status === 'cancelled' ? 'skipped' : 'failed') + '</td>' +
            '<td class="cell-id">' + fmtWhen(r.finishedAt) + '</td></tr>'
          );
        })
        .join('') || '<tr><td colspan="9" style="text-align:center;color:var(--text-faint);padding:30px;">No runs yet — start one from Test Runs.</td></tr>';
  }

  // ---------------------------------------------------------------------
  // Results page
  // ---------------------------------------------------------------------
  function populateResultsRunSelect() {
    var sel = $('results-run-select');
    sel.innerHTML = STATE.historyRuns
      .map(function (r, i) {
        return '<option value="' + esc(r.id) + '">' + shortId(r.id) + ' — ' + fmtWhen(r.finishedAt) + (i === 0 ? ' (latest)' : '') + '</option>';
      })
      .join('') || '<option>No runs yet</option>';
  }
  $('results-run-select').addEventListener('change', function (e) {
    loadResultsRun(e.target.value);
  });

  var resultsReqId = 0;
  function loadResultsRun(runId) {
    var myId = ++resultsReqId;
    return fetch('/api/results/' + encodeURIComponent(runId))
      .then(function (r) {
        return r.json();
      })
      .then(function (run) {
        if (myId !== resultsReqId) return;
        STATE.resultsRun = run;
        STATE.latestRun = STATE.latestRun || run;
        $('results-run-sub').textContent = shortId(run.id) + ' · ' + run.config.environment + ' · ' + fmtWhen(run.finishedAt);
        renderResults();
      })
      .catch(function () {});
  }

  function renderResults() {
    var run = STATE.resultsRun;
    var tabs = document.querySelectorAll('.status-tab');
    if (!run) {
      $('results-table').innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-faint);padding:30px;">No runs yet — start one from Test Runs.</td></tr>';
      tabs.forEach(function (t) {
        t.textContent = t.textContent.replace(/\d+$/, '0');
      });
      return;
    }
    var all = run.tests.length;
    tabs.forEach(function (t) {
      var s = t.dataset.status;
      var n = s === '' ? all : run.tests.filter(function (x) { return x.status === s; }).length;
      var label = s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1);
      t.textContent = label + ' ' + n;
    });

    var f = STATE.resultsFilters;
    var rows = run.tests.filter(function (t, i) {
      t.__index = i;
      if (f.status && t.status !== f.status) return false;
      if (f.browser && t.project !== f.browser) return false;
      if (f.suite && t.suite !== f.suite) return false;
      if (f.q && t.title.toLowerCase().indexOf(f.q.toLowerCase()) === -1) return false;
      return true;
    });

    $('results-table').innerHTML =
      rows
        .map(function (t) {
          var clickable = t.status !== 'passed';
          var retriedTag = t.attempts > 1 ? '<div class="cell-sub">retried ' + (t.attempts - 1) + 'x</div>' : '';
          var reasonTag = '';
          if (t.status === 'skipped') {
            reasonTag = '<div class="cell-sub" style="white-space:normal;">' + esc(truncate(t.reason || 'No reason given', 80)) + '</div>';
          } else if (t.category) {
            reasonTag = '<div class="cell-sub" style="white-space:normal;">' + esc(t.category) + (t.error && t.error.message ? ' — ' + esc(truncate(t.error.message, 70)) : '') + '</div>';
          }
          return (
            '<tr class="' + (clickable ? 'clickable' : '') + '" data-idx="' + t.__index + '"><td class="cell-name">' + esc(t.title) + retriedTag + reasonTag + '</td><td>' + esc(t.suite || '') + '</td><td>' +
            bchip(t.project) + '</td><td>' + badge(t.status) + '</td><td class="mono">' + fmtDuration(t.duration) + '</td><td class="cell-id">' + fmtWhen(run.finishedAt) + '</td></tr>'
          );
        })
        .join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-faint);padding:30px;">No results match these filters.</td></tr>';

    document.querySelectorAll('#results-table tr.clickable').forEach(function (tr) {
      tr.addEventListener('click', function () {
        openDrawer(run.tests[parseInt(tr.dataset.idx, 10)], parseInt(tr.dataset.idx, 10));
      });
    });
  }
  document.querySelectorAll('.status-tab').forEach(function (t) {
    t.addEventListener('click', function () {
      document.querySelectorAll('.status-tab').forEach(function (x) {
        x.classList.remove('on');
      });
      t.classList.add('on');
      STATE.resultsFilters.status = t.dataset.status;
      renderResults();
    });
  });
  $('results-browser-filter').addEventListener('change', function (e) {
    STATE.resultsFilters.browser = e.target.value;
    renderResults();
  });
  $('results-suite-filter').addEventListener('change', function (e) {
    STATE.resultsFilters.suite = e.target.value;
    renderResults();
  });
  $('results-search').addEventListener('input', function (e) {
    STATE.resultsFilters.q = e.target.value;
    renderResults();
  });

  // ---------------------------------------------------------------------
  // Result detail drawer
  // ---------------------------------------------------------------------
  function openDrawer(test, testIndex) {
    $('history-drawer').classList.remove('show');
    $('d-title').textContent = test.title;
    $('d-sub').textContent = (test.suite || '') + ' · ' + (BROWSER_META[test.project] ? BROWSER_META[test.project].label : test.project) + ' · ' + shortId(STATE.resultsRun.id);

    var catEl = $('d-error-category');
    if (catEl) {
      catEl.innerHTML = test.category ? '<span class="badge fail">' + esc(test.category) + '</span>' : '';
    }
    var headingEl = $('d-error-heading');
    if (headingEl) headingEl.firstChild.textContent = test.status === 'skipped' ? 'Skip reason' : 'Error';

    if (test.status === 'skipped') {
      $('d-error').textContent = test.reason || 'This test was skipped (no reason given).';
    } else if (test.error) {
      $('d-error').innerHTML =
        '<span class="err">' + esc(test.error.message || 'Test failed') + '</span>' +
        (test.error.stack ? '\n\n<span class="dim">' + esc(test.error.stack) + '</span>' : '');
    } else {
      $('d-error').textContent = 'No error recorded.';
    }

    var stepsSection = $('d-steps-section');
    if (test.steps && test.steps.length) {
      stepsSection.hidden = false;
      $('d-steps').innerHTML = test.steps
        .map(function (s) {
          return '<div class="step ' + (s.error ? 'bad' : 'ok') + '"><div class="si">' + (s.error ? '✕' : '✓') + '</div>' + esc(s.title) + '</div>';
        })
        .join('');
    } else {
      stepsSection.hidden = true;
    }

    var attSection = $('d-attachments-section');
    if (test.attachments && test.attachments.length) {
      attSection.hidden = false;
      $('d-attachments').innerHTML = test.attachments
        .map(function (a, i) {
          var url = '/api/attachment/' + encodeURIComponent(STATE.resultsRun.id) + '/' + testIndex + '/' + i;
          if ((a.contentType || '').indexOf('image/') === 0) {
            return '<div class="shot" style="margin-bottom:10px;"><img src="' + url + '" alt="' + esc(a.name) + '" style="display:block;width:100%;"></div>';
          }
          return '<div style="margin-bottom:6px;"><a href="' + url + '" target="_blank" rel="noopener" style="color:var(--accent);font-size:12.5px;font-weight:600;">' + esc(a.name) + '</a></div>';
        })
        .join('');
    } else {
      attSection.hidden = true;
    }

    $('scrim').classList.add('show');
    $('drawer').classList.add('show');
  }
  function closeDrawer() {
    $('scrim').classList.remove('show');
    $('drawer').classList.remove('show');
  }
  $('drawer-close').addEventListener('click', closeDrawer);
  $('scrim').addEventListener('click', function () {
    closeDrawer();
    closeHistoryDrawer();
  });

  // ---------------------------------------------------------------------
  // Test history drawer (Test Cases page — "when was this last run", full history)
  // ---------------------------------------------------------------------
  function loadTestHistory() {
    return fetch('/api/test-history')
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        STATE.testHistory = data.tests || {};
      })
      .catch(function () {});
  }

  function openHistoryDrawer(key) {
    $('drawer').classList.remove('show');
    var entry = STATE.testHistory[key];
    var meta = STATE.testsById[key];
    $('h-title').textContent = (meta && meta.title) || (entry && entry.title) || 'Test';
    $('h-sub').textContent = (meta && meta.suite) || (entry && entry.suite) || '';

    var perBrowser = $('h-last-per-browser');
    var historyTable = $('h-history-table');
    if (!entry || !entry.history.length) {
      perBrowser.innerHTML = '<div style="color:var(--text-faint); font-size:12.5px;">This test hasn\'t been run yet.</div>';
      historyTable.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:20px;">No history yet.</td></tr>';
    } else {
      perBrowser.innerHTML = Object.keys(entry.byProject)
        .map(function (p) {
          var pt = entry.byProject[p];
          return (
            '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">' +
            bchip(p) + '<span style="display:flex;align-items:center;gap:10px;">' + badge(pt.status) +
            '<span class="mono" style="font-size:11.5px;color:var(--text-faint);">' + fmtWhen(pt.finishedAt) + '</span></span></div>'
          );
        })
        .join('');

      var rows = entry.history
        .slice()
        .reverse() // newest first
        .map(function (p) {
          return (
            '<tr><td class="cell-id" style="padding:6px 0;">' + shortId(p.runId) + '</td><td>' + bchip(p.project) + '</td><td>' +
            badge(p.status) + '</td><td class="mono">' + fmtDuration(p.duration) + '</td><td class="cell-id">' + fmtWhen(p.finishedAt) + '</td></tr>'
          );
        });
      historyTable.innerHTML = rows.join('');
    }

    $('scrim').classList.add('show');
    $('history-drawer').classList.add('show');
  }
  function closeHistoryDrawer() {
    $('history-drawer').classList.remove('show');
  }
  $('history-drawer-close').addEventListener('click', function () {
    $('scrim').classList.remove('show');
    closeHistoryDrawer();
  });

  // ---------------------------------------------------------------------
  // Reports page
  // ---------------------------------------------------------------------
  var reportsReqId = 0;
  function loadReports() {
    var myId = ++reportsReqId;
    return fetch('/api/reports')
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (myId !== reportsReqId) return; // a newer request already landed — drop this stale one
        renderTrend(data.trend || []);
        renderFlaky(data.flaky || []);
        renderBroken(data.broken || []);
        renderMismatch(data.crossBrowser || []);
        renderSkipped(data.skipped || []);
      })
      .catch(function () {});
  }
  function renderTrend(trend) {
    var svg = $('trend-svg');
    var empty = $('trend-empty');
    var labels = $('trend-labels');
    if (trend.length < 2) {
      // SVGElement.hidden doesn't reliably reflect to/from the "hidden" attribute in every
      // browser, and a stale attribute would win over inline style via [hidden]{!important} —
      // so this element is shown/hidden via the attribute + style together, not .hidden.
      svg.setAttribute('hidden', '');
      svg.style.display = 'none';
      empty.hidden = false;
      labels.innerHTML = '';
      return;
    }
    empty.hidden = true;
    svg.removeAttribute('hidden');
    svg.style.display = '';
    svg.setAttribute('viewBox', '0 0 640 180');

    var minY = Math.min(70, Math.min.apply(null, trend.map(function (t) { return t.passRate; })) - 5);
    var maxY = 100;
    var x0 = 30, x1 = 620, y0 = 150, y1 = 20;
    function xAt(i) { return x0 + (trend.length === 1 ? 0 : (i / (trend.length - 1)) * (x1 - x0)); }
    function yAt(v) { return y0 - ((v - minY) / (maxY - minY)) * (y0 - y1); }

    var points = trend.map(function (t, i) { return xAt(i) + ',' + yAt(t.passRate); }).join(' ');
    var dots = trend
      .map(function (t, i) {
        var last = i === trend.length - 1;
        return '<circle cx="' + xAt(i) + '" cy="' + yAt(t.passRate) + '" r="' + (last ? 4.5 : 3.5) + '"' + (last ? ' stroke="var(--surface)" stroke-width="2"' : '') + '/>';
      })
      .join('');
    var gridLines = [100, 90, 80, 70]
      .filter(function (v) { return v >= minY; })
      .map(function (v) {
        return '<line x1="' + x0 + '" y1="' + yAt(v) + '" x2="' + x1 + '" y2="' + yAt(v) + '" stroke="var(--border)" stroke-width="1"/>' +
          '<text x="0" y="' + (yAt(v) + 4) + '" font-size="10" fill="var(--text-faint)" font-family="var(--font-mono)">' + v + '%</text>';
      })
      .join('');
    var lastPoint = trend[trend.length - 1];

    svg.innerHTML =
      gridLines +
      '<polyline points="' + points + '" fill="none" stroke="var(--accent)" stroke-width="2.5"/>' +
      '<g fill="var(--accent)">' + dots + '</g>' +
      '<text x="' + xAt(trend.length - 1) + '" y="' + (yAt(lastPoint.passRate) - 12) + '" font-size="11" font-weight="700" fill="var(--accent)" font-family="var(--font-display)" text-anchor="middle">' + lastPoint.passRate + '%</text>';

    labels.innerHTML = trend.map(function (t) { return '<span>#' + esc(t.shortId) + '</span>'; }).join('');
  }
  function renderFlaky(flaky) {
    $('flaky-table').innerHTML =
      flaky
        .map(function (f) {
          return (
            '<tr><td class="cell-name">' + esc(f.title) + '</td><td>' + esc(f.suite || '') + '</td><td>' + bchip(f.project) + '</td>' +
            '<td><span class="badge fail">' + f.flakeRate + '%</span></td><td class="cell-id">' + shortId(f.lastRun) + '</td></tr>'
          );
        })
        .join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:26px;">No flaky tests detected yet.</td></tr>';
  }
  function renderBroken(broken) {
    $('broken-table').innerHTML =
      broken
        .map(function (b) {
          var reason = (b.category ? '<span class="badge fail" style="margin-right:6px;">' + esc(b.category) + '</span>' : '') +
            (b.errorMessage ? '<span class="cell-sub" style="white-space:normal;">' + esc(truncate(b.errorMessage, 90)) + '</span>' : '');
          return (
            '<tr><td class="cell-name">' + esc(b.title) + '</td><td>' + esc(b.suite || '') + '</td><td>' + bchip(b.project) + '</td>' +
            '<td>' + (reason || '—') + '</td>' +
            '<td class="mono">' + b.runsFailing + ' run' + (b.runsFailing === 1 ? '' : 's') + '</td><td class="cell-id">' + fmtWhen(b.failingSince) + '</td></tr>'
          );
        })
        .join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-faint);padding:26px;">Nothing currently failing.</td></tr>';
  }

  function renderSkipped(skipped) {
    var el = $('skipped-table');
    if (!el) return;
    el.innerHTML =
      skipped
        .map(function (s) {
          return (
            '<tr><td class="cell-name">' + esc(s.title) + '</td><td>' + esc(s.suite || '') + '</td><td>' +
            s.projects.map(bchip).join(' ') + '</td><td style="white-space:normal;">' + esc(s.reason || 'No reason given') + '</td>' +
            '<td class="cell-id">' + fmtWhen(s.lastRunAt) + '</td></tr>'
          );
        })
        .join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:26px;">Nothing currently skipped.</td></tr>';
  }

  function renderMismatch(mismatches) {
    var order = ['chromium', 'firefox', 'webkit'];
    $('mismatch-table').innerHTML =
      mismatches
        .map(function (m) {
          var byProject = {};
          m.results.forEach(function (r) {
            byProject[r.project] = r;
          });
          var cells = order
            .map(function (p) {
              var r = byProject[p];
              if (!r) return '<td><span style="color:var(--text-faint);">—</span></td>';
              var reason = r.reason || r.errorMessage;
              var title = reason ? ' title="' + esc(truncate(reason, 200)) + '"' : '';
              return '<td' + title + '>' + badge(r.status) + (r.category ? '<div class="cell-sub">' + esc(r.category) + '</div>' : '') + '</td>';
            })
            .join('');
          return '<tr><td class="cell-name">' + esc(m.title) + '</td><td>' + esc(m.suite || '') + '</td>' + cells + '</tr>';
        })
        .join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:26px;">No browser-specific differences detected.</td></tr>';
  }

  document.querySelector('[data-view="reports"]').addEventListener('click', loadReports);

  // ---------------------------------------------------------------------
  // Version control (read-only) — git status, per-file history and diffs on the Test Cases
  // tab. Data comes from /api/git/*; nothing here commits or pushes.
  // ---------------------------------------------------------------------
  STATE.git = { available: false, reason: 'Loading…', files: {} };
  STATE.caseMode = 'source'; // 'source' | 'history' | 'diff'
  STATE.caseDiffSha = null;
  STATE.caseSourceHtml = '';
  STATE.gitHistory = {}; // repo-relative path -> commits[]
  var GIT_STATUS_LABEL = { new: 'New, not committed', modified: 'Modified', renamed: 'Renamed', deleted: 'Deleted', committed: 'Committed' };

  function caseRel(c) {
    return 'test-cases/' + relFile(c.file);
  }
  function gitFileStatus(c) {
    var g = STATE.git;
    if (!g || !g.available) return null;
    return g.files[caseRel(c)] || 'committed';
  }
  function gitDot(c) {
    var s = gitFileStatus(c);
    var cls = { modified: 'mod', renamed: 'mod', new: 'new', deleted: 'del' }[s];
    if (!cls) return '';
    return '<i class="git-dot ' + cls + '" title="' + esc(s === 'new' ? 'New file, not committed yet' : 'Uncommitted changes') + '"></i>';
  }

  function loadGit() {
    return fetch('/api/git/status')
      .then(function (r) {
        return r.json();
      })
      .then(function (g) {
        STATE.git = g;
      })
      .catch(function () {
        STATE.git = { available: false, reason: 'the dashboard server could not be reached.', files: {} };
      })
      .then(function () {
        STATE.gitHistory = {};
        renderGitBar();
        buildCaseTree($('cases-search').value);
        renderGitStrip();
      });
  }

  function renderGitBar() {
    var bar = $('cases-git-bar');
    var g = STATE.git;
    bar.hidden = false;
    if (!g.available) {
      bar.innerHTML = '<span>Version control is unavailable — ' + esc(g.reason || '') + '</span><button type="button" class="git-refresh" id="git-refresh">Retry</button>';
    } else {
      var counts = { modified: 0, new: 0, deleted: 0 };
      Object.keys(g.files).forEach(function (k) {
        var s = g.files[k] === 'renamed' ? 'modified' : g.files[k];
        counts[s] = (counts[s] || 0) + 1;
      });
      var parts = [];
      if (counts.modified) parts.push(counts.modified + ' modified');
      if (counts.new) parts.push(counts.new + ' new');
      if (counts.deleted) parts.push(counts.deleted + ' deleted');
      var sync = '';
      if (g.ahead === null) sync = '<span class="git-warn">No upstream branch set</span>';
      else {
        if (g.ahead > 0) sync += '<span class="git-warn">↑ ' + g.ahead + ' unpushed commit' + (g.ahead === 1 ? '' : 's') + '</span> ';
        if (g.behind > 0) sync += '<span class="git-warn">↓ ' + g.behind + ' behind origin (as of the last fetch)</span>';
        if (!g.ahead && !g.behind) sync = '<span>In sync with origin</span>';
      }
      bar.innerHTML =
        '<span class="git-chip">' + esc(g.branch || 'detached') + (g.head ? ' · ' + esc(g.head) : '') + '</span>' +
        (g.webUrl ? '<a href="' + esc(g.webUrl) + '" target="_blank" rel="noopener">' + esc(g.slug) + ' ↗</a>' : '<span>No GitHub remote</span>') +
        '<span class="sep">|</span><span>' + (parts.length ? esc(parts.join(' · ')) + ' test file' + (parts.length === 1 && counts.modified + counts.new + counts.deleted === 1 ? '' : 's') + ' not committed' : 'All test files committed') + '</span>' +
        '<span class="sep">|</span>' + sync +
        '<button type="button" class="git-refresh" id="git-refresh">Refresh</button>';
    }
    $('git-refresh').addEventListener('click', loadGit);
  }

  function activeCase() {
    return STATE.activeCaseId ? STATE.testsById[STATE.activeCaseId] : null;
  }

  function renderGitStrip() {
    var strip = $('cases-git-strip');
    var c = activeCase();
    var g = STATE.git;
    if (!c || !g || !g.available) {
      strip.hidden = true;
      return;
    }
    var rel = caseRel(c);
    var st = gitFileStatus(c);
    var hist = STATE.gitHistory[rel];
    if (hist === undefined) loadGitHistory(rel, c);

    var last;
    if (hist === undefined) last = 'Loading history…';
    else if (!hist.length) last = 'No commits yet for this file';
    else {
      var h = hist[0];
      last =
        'Last commit <a href="' + esc(g.webUrl ? g.webUrl + '/commit/' + h.sha : '#') + '" target="_blank" rel="noopener">' + esc(h.short) + '</a> — ' +
        esc(truncate(h.subject, 70)) + ' · ' + esc(h.author) + ' · ' + esc(fmtWhen(h.date));
    }
    var mode = STATE.caseMode;
    var onHistory = mode === 'history' || (mode === 'diff' && STATE.caseDiffSha);
    var canDiff = st === 'modified' || st === 'renamed' || st === 'new';
    strip.hidden = false;
    strip.innerHTML =
      '<span class="badge git-' + esc(st) + '">' + esc(GIT_STATUS_LABEL[st] || st) + '</span>' +
      '<span class="git-last">' + last + '</span>' +
      '<span class="git-tabs">' +
      '<button type="button" class="git-tab' + (mode === 'source' ? ' on' : '') + '" data-case-mode="source">Source</button>' +
      '<button type="button" class="git-tab' + (onHistory ? ' on' : '') + '" data-case-mode="history">History' + (hist ? ' (' + hist.length + ')' : '') + '</button>' +
      (canDiff ? '<button type="button" class="git-tab' + (mode === 'diff' && !STATE.caseDiffSha ? ' on' : '') + '" data-case-mode="changes">Changes</button>' : '') +
      '</span>' +
      (g.webUrl && st !== 'new' ? '<a href="' + esc(g.webUrl + '/blob/' + encodeURI(g.branch || 'main') + '/' + encodeURI(rel)) + '" target="_blank" rel="noopener">View on GitHub ↗</a>' : '');
    strip.querySelectorAll('[data-case-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var m = btn.dataset.caseMode;
        if (m === 'changes') showCaseDiff(null);
        else setCaseMode(m);
      });
    });
  }

  var gitHistoryPending = {};
  function loadGitHistory(rel, c) {
    if (gitHistoryPending[rel]) return;
    gitHistoryPending[rel] = true;
    fetch('/api/git/history?file=' + encodeURIComponent(c.file))
      .then(function (r) {
        return r.ok ? r.json() : { commits: [] };
      })
      .catch(function () {
        return { commits: [] };
      })
      .then(function (data) {
        delete gitHistoryPending[rel];
        STATE.gitHistory[rel] = data.commits || [];
        var cur = activeCase();
        if (cur && caseRel(cur) === rel) {
          renderGitStrip();
          if (STATE.caseMode === 'history') renderCaseHistory();
        }
      });
  }

  function setCaseMode(mode) {
    STATE.caseMode = mode;
    STATE.caseDiffSha = null;
    renderGitStrip();
    if (mode === 'source') $('cases-viewer-body').innerHTML = STATE.caseSourceHtml || '<div class="live-col-empty">Loading…</div>';
    else renderCaseHistory();
  }

  function renderCaseHistory() {
    var c = activeCase();
    if (!c) return;
    var hist = STATE.gitHistory[caseRel(c)];
    var g = STATE.git;
    if (hist === undefined) {
      $('cases-viewer-body').innerHTML = '<div class="diff-note">Loading history…</div>';
      return;
    }
    if (!hist.length) {
      $('cases-viewer-body').innerHTML = '<div class="diff-note">This file has not been committed yet, so it has no history. Commit it from your terminal to start tracking it.</div>';
      return;
    }
    $('cases-viewer-body').innerHTML = hist
      .map(function (h) {
        return (
          '<div class="git-commit">' +
          '<a class="sha" href="' + esc(g.webUrl ? g.webUrl + '/commit/' + h.sha : '#') + '" target="_blank" rel="noopener">' + esc(h.short) + '</a>' +
          '<span class="subj">' + esc(h.subject) + '</span>' +
          '<span class="meta">' + esc(h.author) + ' · ' + esc(fmtDate(h.date.slice(0, 10))) + '</span>' +
          '<button type="button" class="git-tab" data-diff-sha="' + esc(h.sha) + '">View changes</button>' +
          '</div>'
        );
      })
      .join('');
    $('cases-viewer-body').querySelectorAll('[data-diff-sha]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showCaseDiff(btn.dataset.diffSha);
      });
    });
  }

  function showCaseDiff(sha) {
    var c = activeCase();
    if (!c) return;
    var caseId = STATE.activeCaseId;
    STATE.caseMode = 'diff';
    STATE.caseDiffSha = sha;
    renderGitStrip();
    $('cases-viewer-body').innerHTML = '<div class="diff-note">Loading changes…</div>';
    fetch('/api/git/diff?file=' + encodeURIComponent(c.file) + (sha ? '&commit=' + encodeURIComponent(sha) : ''))
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.error || 'Could not load the changes.');
          return data;
        });
      })
      .then(function (data) {
        if (STATE.activeCaseId !== caseId || STATE.caseMode !== 'diff' || STATE.caseDiffSha !== sha) return;
        var head = sha
          ? '<div class="diff-note"><button type="button" class="git-tab" id="diff-back">← Back to history</button> &nbsp; Changes made by commit ' + esc(sha.slice(0, 7)) + '</div>'
          : '';
        var body;
        if (data.untracked) body = '<div class="diff-note">This is a new file that has not been committed yet, so there is nothing to compare it with. Commit it from your terminal to start tracking it.</div>';
        else if (!data.text.trim()) body = '<div class="diff-note">No changes to show.</div>';
        else {
          body = data.text
            .split('\n')
            .map(function (line) {
              var cls = '';
              if (/^(diff --git|index |--- |\+\+\+ |new file|deleted file|similarity|rename )/.test(line)) cls = 'meta';
              else if (line.charAt(0) === '@') cls = 'hunk';
              else if (line.charAt(0) === '+') cls = 'add';
              else if (line.charAt(0) === '-') cls = 'del';
              return '<div class="diff-line ' + cls + '">' + esc(line || ' ') + '</div>';
            })
            .join('') + (data.truncated ? '<div class="diff-note">Diff truncated — it is larger than 300 KB.</div>' : '');
        }
        $('cases-viewer-body').innerHTML = head + body;
        var back = $('diff-back');
        if (back) back.addEventListener('click', function () { setCaseMode('history'); });
      })
      .catch(function (e) {
        if (STATE.activeCaseId !== caseId) return;
        $('cases-viewer-body').innerHTML = '<div class="alert-banner">' + esc(e.message) + '</div>';
      });
  }

  document.querySelector('[data-view="cases"]').addEventListener('click', loadGit);

  // ---------------------------------------------------------------------
  // Bug Log — bugs found by the suites: date found, severity, status, and the test case(s)
  // that exposed each one. Stored server-side in data/bugs.json.
  // ---------------------------------------------------------------------
  var SEVERITY_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
  var SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  var BUG_STATUS_LABEL = { open: 'Open', fixed: 'Fixed', wontfix: "Won't fix" };
  STATE.bugs = [];
  STATE.bugFilters = { status: '', severity: '', suite: '', q: '' };
  STATE.bugForm = { editingId: null, testCases: [] };

  function todayLocal() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function fmtDate(s) {
    if (!s) return '—';
    return new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  // Whole-day "ago" for a YYYY-MM-DD date (fmtWhen would call today's date "15 hr ago").
  function daysAgo(s) {
    var days = Math.round((new Date(todayLocal() + 'T00:00:00') - new Date(s + 'T00:00:00')) / 86400000);
    if (days <= 0) return 'today';
    return days === 1 ? 'yesterday' : days + ' days ago';
  }
  function tcId(title) {
    var m = String(title || '').match(/^TC\d+[A-Za-z0-9-]*/);
    return m ? m[0] : truncate(title, 18);
  }
  // The API reports absolute paths; the log stores them relative to test-cases/ so entries
  // stay valid on another machine or inside Docker.
  function relFile(f) {
    return String(f || '').replace(/^.*test-cases\//, '');
  }
  function sameCase(a, b) {
    return a.title === b.title && relFile(a.file) === relFile(b.file);
  }

  function loadBugs() {
    return fetch('/api/bugs')
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        STATE.bugs = data.bugs || [];
        renderBugs();
      })
      .catch(function () {
        $('bug-table').innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--danger);padding:26px;">Could not load the bug log.</td></tr>';
      });
  }

  function renderBugs() {
    var bugs = STATE.bugs;
    var f = STATE.bugFilters;
    var counts = { '': bugs.length, open: 0, fixed: 0, wontfix: 0 };
    bugs.forEach(function (b) {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    document.querySelectorAll('#bug-status-tabs .status-tab').forEach(function (tab) {
      var s = tab.dataset.status;
      tab.textContent = (s ? BUG_STATUS_LABEL[s] : 'All') + ' ' + (counts[s] || 0);
      tab.classList.toggle('on', s === f.status);
    });
    $('nav-bug-count').textContent = String(counts.open || 0);
    $('bugs-sub').textContent = bugs.length
      ? counts.open + ' open · ' + counts.fixed + ' fixed · ' + bugs.length + ' logged in total'
      : 'Bugs found while running the suites';

    var suites = {};
    bugs.forEach(function (b) {
      b.testCases.forEach(function (tc) {
        if (tc.suite) suites[tc.suite] = true;
      });
    });
    var suiteSel = $('bug-suite-filter');
    suiteSel.innerHTML =
      '<option value="">All suites</option>' +
      Object.keys(suites)
        .sort()
        .map(function (s) {
          return '<option value="' + esc(s) + '"' + (s === f.suite ? ' selected' : '') + '>' + esc(s) + '</option>';
        })
        .join('');

    var q = f.q.trim().toLowerCase();
    var shown = bugs
      .filter(function (b) {
        if (f.status && b.status !== f.status) return false;
        if (f.severity && b.severity !== f.severity) return false;
        if (f.suite && !b.testCases.some(function (tc) { return tc.suite === f.suite; })) return false;
        if (!q) return true;
        var hay = [b.id, b.title, b.description].concat(b.testCases.map(function (tc) { return tc.title; })).join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      })
      .sort(function (a, b) {
        var open = (a.status === 'open' ? 0 : 1) - (b.status === 'open' ? 0 : 1);
        if (open) return open;
        if (SEVERITY_ORDER[a.severity] !== SEVERITY_ORDER[b.severity]) return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        return a.foundAt < b.foundAt ? 1 : a.foundAt > b.foundAt ? -1 : 0;
      });

    if (!shown.length) {
      $('bug-table').innerHTML =
        '<tr><td colspan="7" style="text-align:center;color:var(--text-faint);padding:26px;">' +
        (bugs.length ? 'No bugs match these filters.' : 'No bugs logged yet. Use “Log a bug” to add the first one.') +
        '</td></tr>';
      return;
    }

    $('bug-table').innerHTML = shown
      .map(function (b) {
        var cases = b.testCases.length
          ? b.testCases
              .map(function (tc) {
                return '<span class="tc-chip" title="' + esc(tc.title + (tc.suite ? ' — ' + tc.suite : '')) + '">' + esc(tcId(tc.title)) + '</span>';
              })
              .join('')
          : '<span style="color:var(--text-faint);font-size:12px;">Found manually</span>';
        if (b.runId) cases += '<div style="font-size:11.5px;color:var(--text-faint);">Run ' + esc(shortId(b.runId)) + '</div>';
        var browsers = b.browsers.length
          ? b.browsers.map(function (k) { return bchip(k); }).join(' ')
          : '<span style="color:var(--text-faint);">—</span>';
        var fixed = b.status === 'fixed' && b.fixedAt ? '<div style="font-size:11.5px;color:var(--text-faint);margin-top:3px;">' + esc(fmtDate(b.fixedAt)) + '</div>' : '';
        return (
          '<tr data-bug="' + esc(b.id) + '">' +
          '<td class="cell-name" style="font-family:var(--font-mono);font-size:12px;white-space:nowrap;">' + esc(b.id) + '</td>' +
          '<td><div class="bug-title-cell">' + esc(b.title) + '</div>' +
          (b.description ? '<div class="bug-desc">' + esc(truncate(b.description, 140)) + '</div>' : '') + '</td>' +
          '<td><span class="badge sev-' + esc(b.severity) + '">' + esc(SEVERITY_LABEL[b.severity]) + '</span></td>' +
          '<td><span class="badge st-' + esc(b.status) + '">' + esc(BUG_STATUS_LABEL[b.status]) + '</span>' + fixed + '</td>' +
          '<td style="white-space:nowrap;">' + esc(fmtDate(b.foundAt)) + '<div style="font-size:11.5px;color:var(--text-faint);">' + esc(daysAgo(b.foundAt)) + '</div></td>' +
          '<td>' + cases + '</td>' +
          '<td>' + browsers + '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  $('bug-table').addEventListener('click', function (e) {
    var row = e.target.closest('tr[data-bug]');
    if (!row) return;
    var bug = STATE.bugs.filter(function (b) { return b.id === row.dataset.bug; })[0];
    if (bug) openBugDrawer(bug);
  });
  $('bug-status-tabs').addEventListener('click', function (e) {
    var tab = e.target.closest('.status-tab');
    if (!tab) return;
    STATE.bugFilters.status = tab.dataset.status;
    renderBugs();
  });
  $('bug-severity-filter').addEventListener('change', function () {
    STATE.bugFilters.severity = this.value;
    renderBugs();
  });
  $('bug-suite-filter').addEventListener('change', function () {
    STATE.bugFilters.suite = this.value;
    renderBugs();
  });
  $('bug-search').addEventListener('input', function () {
    STATE.bugFilters.q = this.value;
    renderBugs();
  });

  // --- Add / edit drawer -------------------------------------------------
  function renderBugSelected() {
    var sel = STATE.bugForm.testCases;
    $('bug-tc-selected').innerHTML = sel.length
      ? sel
          .map(function (tc, i) {
            return '<span class="tc-chip" data-remove="' + i + '" title="' + esc(tc.title) + ' — click to remove">' + esc(tcId(tc.title)) + ' ✕</span>';
          })
          .join('')
      : '<span style="font-size:12px;color:var(--text-faint);">None linked — leave empty if the bug was found by hand.</span>';
  }
  function renderBugTestList() {
    var q = $('bug-tc-search').value.trim().toLowerCase();
    var all = Object.keys(STATE.testsById).map(function (k) {
      return STATE.testsById[k];
    });
    var matches = all.filter(function (t) {
      return !q || (t.title + ' ' + t.suite).toLowerCase().indexOf(q) !== -1;
    });
    var shown = matches.slice(0, 60);
    $('bug-tc-list').innerHTML = shown.length
      ? shown
          .map(function (t) {
            var idx = all.indexOf(t);
            var on = STATE.bugForm.testCases.some(function (tc) { return sameCase(tc, t); });
            return (
              '<label><input type="checkbox" data-idx="' + idx + '"' + (on ? ' checked' : '') + '><span>' +
              esc(t.title) + '<div style="font-size:11.5px;color:var(--text-faint);">' + esc(t.suite || '') + '</div></span></label>'
            );
          })
          .join('') + (matches.length > shown.length ? '<div class="empty">' + (matches.length - shown.length) + ' more — refine the search.</div>' : '')
      : '<div class="empty">' + (all.length ? 'No test cases match.' : 'Test cases are still loading…') + '</div>';
    $('bug-tc-list')._all = all;
  }
  $('bug-tc-search').addEventListener('input', renderBugTestList);
  $('bug-tc-list').addEventListener('change', function (e) {
    var box = e.target;
    if (!box.matches('input[type=checkbox]')) return;
    var t = $('bug-tc-list')._all[parseInt(box.dataset.idx, 10)];
    var ref = { file: relFile(t.file), title: t.title, suite: t.suite };
    STATE.bugForm.testCases = STATE.bugForm.testCases.filter(function (tc) { return !sameCase(tc, ref); });
    if (box.checked) STATE.bugForm.testCases.push(ref);
    renderBugSelected();
  });
  $('bug-tc-selected').addEventListener('click', function (e) {
    var chip = e.target.closest('[data-remove]');
    if (!chip) return;
    STATE.bugForm.testCases.splice(parseInt(chip.dataset.remove, 10), 1);
    renderBugSelected();
    renderBugTestList();
  });

  function openBugDrawer(bug) {
    var isNew = !bug;
    STATE.bugForm.editingId = isNew ? null : bug.id;
    STATE.bugForm.testCases = isNew ? [] : bug.testCases.map(function (tc) { return { file: tc.file, title: tc.title, suite: tc.suite }; });
    $('bug-drawer-title').textContent = isNew ? 'Log a bug' : bug.id;
    $('bug-drawer-sub').textContent = isNew ? 'Record what was found and which test case found it' : 'Logged ' + fmtDate(bug.createdAt.slice(0, 10)) + ' · last updated ' + fmtWhen(bug.updatedAt);
    $('bug-title').value = isNew ? '' : bug.title;
    $('bug-description').value = isNew ? '' : bug.description;
    $('bug-severity').value = isNew ? 'medium' : bug.severity;
    $('bug-status').value = isNew ? 'open' : bug.status;
    $('bug-found').value = isNew ? todayLocal() : bug.foundAt;
    $('bug-notes').value = isNew ? '' : bug.notes;
    document.querySelectorAll('#bug-browsers input').forEach(function (cb) {
      cb.checked = isNew ? true : bug.browsers.indexOf(cb.value) !== -1;
    });
    var runSel = $('bug-run');
    var runIds = STATE.historyRuns.map(function (r) { return r.id; });
    var options = '<option value="">Not linked to a saved run</option>';
    if (!isNew && bug.runId && runIds.indexOf(bug.runId) === -1) options += '<option value="' + esc(bug.runId) + '">' + esc(shortId(bug.runId)) + ' (no longer saved)</option>';
    STATE.historyRuns.forEach(function (r) {
      options += '<option value="' + esc(r.id) + '">' + esc(shortId(r.id)) + ' · ' + esc(new Date(r.startedAt).toLocaleString()) + '</option>';
    });
    runSel.innerHTML = options;
    runSel.value = isNew ? '' : bug.runId || '';
    $('bug-tc-search').value = '';
    $('bug-error').hidden = true;
    $('bug-delete').hidden = isNew;
    renderBugSelected();
    renderBugTestList();
    $('scrim').classList.add('show');
    $('bug-drawer').classList.add('show');
    $('bug-title').focus();
  }
  function closeBugDrawer() {
    $('bug-drawer').classList.remove('show');
    if (!$('drawer').classList.contains('show') && !$('history-drawer').classList.contains('show')) $('scrim').classList.remove('show');
  }
  $('bug-add').addEventListener('click', function () {
    openBugDrawer(null);
  });
  $('bug-drawer-close').addEventListener('click', closeBugDrawer);
  $('bug-cancel').addEventListener('click', closeBugDrawer);
  $('scrim').addEventListener('click', closeBugDrawer);

  function showBugError(message) {
    $('bug-error').textContent = message;
    $('bug-error').hidden = false;
    $('bug-error').scrollIntoView({ block: 'nearest' });
  }
  $('bug-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var payload = {
      title: $('bug-title').value,
      description: $('bug-description').value,
      severity: $('bug-severity').value,
      status: $('bug-status').value,
      foundAt: $('bug-found').value,
      notes: $('bug-notes').value,
      runId: $('bug-run').value || null,
      browsers: Array.prototype.map.call(document.querySelectorAll('#bug-browsers input:checked'), function (cb) { return cb.value; }),
      testCases: STATE.bugForm.testCases,
    };
    if (!payload.title.trim()) return showBugError('Title is required.');
    if (!payload.foundAt) return showBugError('Date found is required.');
    var id = STATE.bugForm.editingId;
    $('bug-save').disabled = true;
    fetch(id ? '/api/bugs/' + encodeURIComponent(id) : '/api/bugs', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.error || 'Could not save the bug.');
        });
      })
      .then(function () {
        closeBugDrawer();
        return loadBugs();
      })
      .catch(function (err) {
        showBugError(err.message);
      })
      .then(function () {
        $('bug-save').disabled = false;
      });
  });
  $('bug-delete').addEventListener('click', function () {
    var id = STATE.bugForm.editingId;
    if (!id || !window.confirm('Delete ' + id + ' from the bug log? This cannot be undone.')) return;
    fetch('/api/bugs/' + encodeURIComponent(id), { method: 'DELETE' })
      .then(function (r) {
        if (!r.ok) throw new Error('Could not delete the bug.');
        closeBugDrawer();
        return loadBugs();
      })
      .catch(function (err) {
        showBugError(err.message);
      });
  });
  document.querySelector('[data-view="bugs"]').addEventListener('click', loadBugs);

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  loadTests()
    .then(function () {
      return loadHistory();
    })
    .then(function () {
      return loadTestHistory();
    })
    .then(function () {
      buildCaseTree('');
      resumeIfActive();
      if ($('bug-drawer').classList.contains('show')) renderBugTestList();
      loadGit();
      return loadBugs();
    });
})();
