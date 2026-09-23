// Embedded terminal for the Test Cases tab — a real shell (via node-pty) bridged over a
// WebSocket, running with this repo as its cwd. Unlike gitInfo.js this is NOT read-only:
// anything typed here (git add/commit/push, npm, playwright) really runs and really reaches
// GitHub. There is no auth beyond same-origin checking, so treat this the way you'd treat
// SSH access to your own machine — fine for local/dev use, not for exposing this dashboard
// on an untrusted network.
const path = require('path');

const ROOT = path.join(__dirname, '..');

let pty;
try {
  pty = require('node-pty');
} catch (e) {
  pty = null;
}

function attach(server) {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ server, path: '/ws/terminal' });

  wss.on('connection', (ws, req) => {
    // Browsers don't apply CORS to WebSocket upgrades, so a page on another origin could
    // otherwise open a shell against this dashboard just by getting the user to visit it.
    // Reject anything whose Origin doesn't match the Host we were reached on.
    const origin = req.headers.origin;
    if (origin) {
      let originHost;
      try {
        originHost = new URL(origin).host;
      } catch (e) {
        ws.close(1008, 'bad origin');
        return;
      }
      if (originHost !== req.headers.host) {
        ws.close(1008, 'origin not allowed');
        return;
      }
    }

    if (!pty) {
      ws.send(JSON.stringify({ type: 'error', message: 'node-pty is not installed. Run npm install and restart the dashboard.' }));
      ws.close();
      return;
    }

    const shell = process.env.SHELL || (process.platform === 'win32' ? 'powershell.exe' : '/bin/bash');
    let term;
    try {
      term = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: ROOT,
        env: process.env,
      });
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'Could not start a shell: ' + e.message }));
      ws.close();
      return;
    }

    term.onData((data) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'data', data: data }));
    });
    term.onExit(() => {
      try {
        ws.close();
      } catch (e) {
        /* already gone */
      }
    });

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch (e) {
        return;
      }
      if (msg.type === 'input' && typeof msg.data === 'string') term.write(msg.data);
      else if (msg.type === 'resize') term.resize(Math.max(1, msg.cols | 0) || 80, Math.max(1, msg.rows | 0) || 24);
    });

    ws.on('close', () => {
      try {
        term.kill();
      } catch (e) {
        /* already gone */
      }
    });
  });
}

module.exports = { attach, available: !!pty };
