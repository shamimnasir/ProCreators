# syntax=docker/dockerfile:1
# Production image for ProCreators (Next.js standalone + ffmpeg + chromium + python).
# The code hardcodes /app/public/* and /root/.venv/bin/python3, so the layout below matches that.

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
# Python venv at the path the API routes spawn. emergentintegrations may live on a private
# index: pass PIP_EXTRA_INDEX_URL at build time if needed.
ARG PIP_EXTRA_INDEX_URL=""
COPY requirements.txt /tmp/requirements.txt
RUN python3 -m venv /root/.venv \
 && /root/.venv/bin/pip install --no-cache-dir requests \
 && ( /root/.venv/bin/pip install --no-cache-dir ${PIP_EXTRA_INDEX_URL:+--extra-index-url "$PIP_EXTRA_INDEX_URL"} -r /tmp/requirements.txt \
      || echo "WARNING: emergentintegrations NOT installed; the ~30 routes that call scripts/llm_call.py will fail" )
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/fonts ./fonts
# Generated files are written under /app/public/* and /app/tmp: mount a persistent volume
# there (or move them to R2), otherwise they vanish on every redeploy.
RUN mkdir -p /app/tmp /app/public/planners /app/public/checklists /app/public/journals \
      /app/public/activity-books /app/public/quizzes /app/public/worksheets /app/public/generated
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s \
  CMD curl -fsS -o /dev/null http://127.0.0.1:3000/ || exit 1
CMD ["node", "server.js"]
