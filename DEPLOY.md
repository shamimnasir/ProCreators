# Deploying ProCreators

The app needs a full Node server (ffmpeg, Chromium, spawned Python, local file writes), so run it as a
container on a Docker-capable host. Cloudflare Workers/Pages is not a fit. Use Cloudflare for DNS, CDN
and R2 only.

## Build and run

```bash
docker build -t procreators .
docker run -p 3000:3000 -v procreators-data:/data --env-file .env procreators
```

- Set every variable in `.env.example` that you use. `STRIPE_WEBHOOK_SECRET` is mandatory in production:
  without it `/api/stripe/webhook` returns 503 and credits nothing.
- Mount a **persistent volume at `/data`**. Generated documents and uploads are written under
  `public/<dir>`; the entrypoint moves those directories onto `/data` (seeding them from the image on
  first boot). Without a volume they are lost on every redeploy.
- Generated files are served by `app/api/files` through fallback rewrites, because Next.js does not
  serve files added to `public/` after startup. The directory list lives in `lib/generated-dirs.js`,
  `next.config.js` and `docker-entrypoint.sh`; keep the three in sync.
- Run a single instance. Rate limiting is in memory per process, and the volume is not shared.
- The container runs as root because routes spawn `/root/.venv/bin/python3`.

## Cloudflare

1. Add the site to Cloudflare, point an A/AAAA/CNAME record for your domain at the host (proxied).
2. SSL/TLS mode "Full (strict)".
3. Restrict the origin to Cloudflare's IP ranges, then set `BEHIND_CLOUDFLARE=true` so the rate limiter
   trusts `CF-Connecting-IP`. Do not set it if the origin is reachable directly.
4. Stripe: add `https://<domain>/api/stripe/webhook` and select the events the handler processes:
   `checkout.session.completed`, `checkout.session.expired`, `invoice.payment_succeeded`,
   `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` and
   `payment_intent.payment_failed`. Put the endpoint's signing secret in `STRIPE_WEBHOOK_SECRET`.

## Known gaps

- Text generation uses `GOOGLE_API_KEY` directly. The previous `emergentintegrations` dependency was removed.
  Image and video generation use other providers (FAL, Replicate, Shotstack).
- `public/` contains generated user files committed to git (about 200 MB). Consider untracking them.
- Rate limiting and the Stripe event claim need MongoDB; they were verified by unit test and code
  reading, not against a live database.
