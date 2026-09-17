# Microsoft's official Playwright image ships Chromium/Firefox/WebKit and every OS-level
# library they need already installed — the exact reason to use Docker here: it removes
# "does this machine have the right browser dependencies" as a source of failure entirely
# (this is what was actually breaking on a friend's machine). The tag's version MUST match
# the @playwright/test version pinned in package.json, or the browsers won't line up with
# the driver npm installs.
FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app

# Install dependencies first so this layer is cached across rebuilds that only change code.
COPY package.json package-lock.json ./
COPY test-cases/package.json test-cases/package.json
RUN npm ci --omit=dev

COPY . .

ENV PORT=4000
EXPOSE 4000

# Results/test-results are meant to be bind-mounted (see docker-compose.yml) so run history
# survives a container rebuild; the image works fine without a mount too, it just starts empty.
CMD ["node", "server/index.js"]
