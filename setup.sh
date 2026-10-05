#!/usr/bin/env bash
# One-command setup for a fresh clone. Docker is the standard way to run the dashboard
# (same browsers and OS libraries on every machine). Plain Node is the fallback when Docker
# isn't installed, or on request.
#   ./setup.sh          set up and start with Docker (falls back to Node if Docker is missing)
#   ./setup.sh node     skip Docker and use plain Node
set -u
cd "$(dirname "$0")"

say()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
warn() { printf '  ! %s\n' "$*"; }

use_node() {
  say "Node + dependencies"
  command -v node >/dev/null 2>&1 || { warn "Node.js not found. Install Docker Desktop or Node 20.12+ (https://nodejs.org), then rerun."; exit 1; }
  node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>20||(a===20&&b>=12)?0:1)' \
    || { warn "Node $(node -v) is too old (need 20.12+). Install Docker Desktop or a newer Node, then rerun."; exit 1; }
  npm install || { warn "npm install failed."; exit 1; }
  say "Playwright browsers"
  npx playwright install || { warn "Browser install failed. Try Docker instead: ./setup.sh"; exit 1; }
  say "Done. Starting the dashboard at http://localhost:4000"
  exec npm start
}

say "1/3  Environment file"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  Created .env from .env.example"
fi
missing=$(grep -E '^HIVE_[A-Z0-9_]+=$' .env | grep -vE 'HIVE_(AUTH|DOMAIN)' | sed 's/=$//' | tr '\n' ' ')
if [ -n "$missing" ]; then
  warn "Empty in .env: $missing"
  warn "Get the filled-in .env from the team vault and replace this one. Tests that need these accounts will fail until then."
fi

say "2/3  Google Sheet key"
if [ -f server/google-key.json ]; then
  echo "  server/google-key.json found"
else
  warn "server/google-key.json is missing. Get it from the team vault (optional: only the Google Sheet page needs it)."
fi

say "3/3  Starting the dashboard"
[ "${1:-}" = "node" ] && use_node
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "  Using Docker (first build downloads ~2-3 GB). Open http://localhost:4000 when it's up."
  exec docker compose up --build
fi
warn "Docker isn't installed or isn't running. Falling back to plain Node."
use_node
