# syntax=docker/dockerfile:1
# Production image for ProCreators (Next.js standalone + ffmpeg + chromium + python).
# The code hardcodes /app/public/* and /root/.venv/bin/python3, so the layout below matches that.
# Runs as root because the API routes spawn /root/.venv/bin/python3.

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --ignore-scripts
COPY . .
# Placeholder values only: some routes construct SDK clients at import time, so `next build`
# needs them set. Real values are supplied at runtime and are NOT baked into the image.
ENV NODE_OPTIONS=--max-old-space-size=4096 \
    RESEND_API_KEY=re_placeholder STRIPE_API_KEY=sk_test_placeholder \
    MAILGUN_API_KEY=placeholder MAILGUN_DOMAIN=example.com GOOGLE_API_KEY=placeholder \
    MONGO_URL=mongodb://localhost:27017 DB_NAME=build NEXT_PUBLIC_BASE_URL=http://localhost:3000
# Skip `yarn build`: its prebuild hook runs apt-get via setup-dependencies.sh.
RUN npx next build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg chromium fonts-noto fonts-noto-cjk python3 python3-venv python3-pip ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*
# Python venv at the path the API routes spawn (scripts/llm_call.py calls Gemini over REST).
COPY requirements.txt /tmp/requirements.txt
RUN python3 -m venv /root/.venv && /root/.venv/bin/pip install --no-cache-dir -r /tmp/requirements.txt
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/fonts ./fonts
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Generated documents and uploads are written under /app/public/<dir>. The entrypoint moves those
# directories onto /data, so mount a persistent volume there or they are lost on every redeploy.
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s \
  CMD curl -fsS -o /dev/null http://127.0.0.1:3000/ || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
