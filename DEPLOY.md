# Hosting HIVE for a remote team

One shared instance = one source of truth for runs, bugs and the queue. Specs sync via git.

## 1. Server
Any Linux VPS, 2 vCPU / 4 GB RAM or more, with Docker + git. Point a DNS A record
(e.g. `hive.yourteam.com`) at it and open ports 80/443.

## 2. Install
```bash
git clone <repo-url> hive && cd hive
cp .env.example .env      # fill test accounts, HIVE_AUTH_USER, HIVE_AUTH_PASS, HIVE_DOMAIN
# copy server/google-key.json and server/sheet-config.json over by hand (git-ignored)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
Open `https://<HIVE_DOMAIN>` and log in with the shared user/pass.

## 3. Keep specs in sync
Specs are bind-mounted, so a pull is enough (no rebuild):
```bash
git pull   # add to cron, e.g. */10 * * * *
```
Team members write specs on branches and merge via PRs as normal; do not edit specs
on the server.

## 4. Backups
`results/`, `data/` (bugs, queue) hold the shared state. Back them up (cron + rsync/S3).

## Notes
- Only one run executes at a time; others wait in the queue.
- The login is a single shared credential. For per-person SSO, put Cloudflare Access or
  Tailscale in front instead and drop the public port.
- Never publish port 4000 directly; `/api/source` can rewrite specs, which are executed code.
