// Single source for the CSRF signing secret, shared by the token issuer (/api/csrf) and every
// verifier. Never a value committed to the repository: without CSRF_SECRET (or SALT) a random
// secret is generated once per process and kept on globalThis, because Next.js bundles each route
// separately and a module-level value would differ between the issuer and the verifiers.
// That suits the single-instance deployment in DEPLOY.md; set CSRF_SECRET for anything else.
import crypto from 'crypto'

export function getCsrfSecret() {
  const configured = process.env.CSRF_SECRET || process.env.SALT
  if (configured) return configured
  if (!globalThis.__procreatorsCsrfSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[csrf] CSRF_SECRET is not set; using a random per-process secret')
    }
    globalThis.__procreatorsCsrfSecret = crypto.randomBytes(32).toString('hex')
  }
  return globalThis.__procreatorsCsrfSecret
}
