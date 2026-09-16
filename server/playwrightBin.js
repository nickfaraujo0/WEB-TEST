const path = require('path');
const fs = require('fs');

function getPlaywrightBin() {
  const bin = process.platform === 'win32' ? 'playwright.cmd' : 'playwright';
  return path.join(__dirname, '..', 'node_modules', '.bin', bin);
}

function playwrightInstalled() {
  return fs.existsSync(getPlaywrightBin());
}

module.exports = { getPlaywrightBin, playwrightInstalled };
