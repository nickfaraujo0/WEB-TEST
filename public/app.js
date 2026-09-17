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
  var VIEWS = ['overview', 'cases', 'runs', 'live', 'results', 'reports', 'settings'];
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
        renderCasesTable('', '');
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
      { id: 'cases-suite-filter', keep: '' },
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
  function renderCasesTable(filterText, filterSuite) {
    var rows = [];
    STATE.suites.forEach(function (s) {
      if (filterSuite && s.name !== filterSuite) return;
      s.cases.forEach(function (c) {
        if (filterText && c.title.toLowerCase().indexOf(filterText.toLowerCase()) === -1) return;
        var entry = STATE.testHistory[c.id];
        var last = mostRecentPoint(entry);
        rows.push(
          '<tr class="clickable" data-test-key="' + esc(c.id) + '"><td class="cell-name">' + esc(c.title) + '</td><td>' + esc(s.name) + '</td><td>' +
            (c.tags && c.tags.length
              ? c.tags.map(function (t) {
                  return '<span class="badge skip" style="margin-right:4px;">' + esc(t) + '</span>';
                }).join('')
              : '<span style="color:var(--text-faint);">—</span>') +
            '</td><td>' + (last ? badge(last.status) : '<span style="color:var(--text-faint);">Not run</span>') + '</td>' +
            '<td class="mono">' + (last ? fmtDuration(last.duration) : '—') + '</td>' +
            '<td class="cell-id">' + (last ? fmtWhen(last.finishedAt) : '—') + '</td></tr>'
        );
      });
    });
    $('cases-table').innerHTML = rows.join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-faint);padding:30px;">No test cases match.</td></tr>';
    document.querySelectorAll('#cases-table tr.clickable').forEach(function (tr) {
      tr.addEventListener('click', function () {
        openHistoryDrawer(tr.dataset.testKey);
      });
    });
  }
  $('cases-search').addEventListener('input', function (e) {
    renderCasesTable(e.target.value, $('cases-suite-filter').value);
  });
  $('cases-suite-filter').addEventListener('change', function (e) {
    renderCasesTable($('cases-search').value, e.target.value);
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
          renderCasesTable($('cases-search').value, $('cases-suite-filter').value);
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
          return (
            '<tr class="' + (clickable ? 'clickable' : '') + '" data-idx="' + t.__index + '"><td class="cell-name">' + esc(t.title) + retriedTag + '</td><td>' + esc(t.suite || '') + '</td><td>' +
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

    if (test.error) {
      $('d-error').innerHTML =
        '<span class="err">' + esc(test.error.message || 'Test failed') + '</span>' +
        (test.error.stack ? '\n\n<span class="dim">' + esc(test.error.stack) + '</span>' : '');
    } else if (test.status === 'skipped') {
      $('d-error').textContent = 'This test was skipped.';
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
          return (
            '<tr><td class="cell-name">' + esc(b.title) + '</td><td>' + esc(b.suite || '') + '</td><td>' + bchip(b.project) + '</td>' +
            '<td class="mono">' + b.runsFailing + ' run' + (b.runsFailing === 1 ? '' : 's') + '</td><td class="cell-id">' + fmtWhen(b.failingSince) + '</td></tr>'
          );
        })
        .join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:26px;">Nothing currently failing.</td></tr>';
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
              return '<td>' + (r ? badge(r.status) : '<span style="color:var(--text-faint);">—</span>') + '</td>';
            })
            .join('');
          return '<tr><td class="cell-name">' + esc(m.title) + '</td><td>' + esc(m.suite || '') + '</td>' + cells + '</tr>';
        })
        .join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-faint);padding:26px;">No browser-specific differences detected.</td></tr>';
  }

  document.querySelector('[data-view="reports"]').addEventListener('click', loadReports);

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
      renderCasesTable('', '');
      resumeIfActive();
    });
})();
