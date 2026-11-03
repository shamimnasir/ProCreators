// Authorize scheduled-job requests. Fails closed when CRON_SECRET is not configured (there used
// to be a hardcoded default), and compares in constant time. Prefer the Authorization header
// ("Bearer <secret>"); ?secret= is still accepted for existing schedulers, but it ends up in logs.
import { timingSafeEqual } from 'crypto'

export function isAuthorizedCron(request) {
  const expected = process.env.CRON_SECRET
  if (!expected || expected.length < 16) return false
  const header = request.headers.get('authorization') || ''
  const provided = header.startsWith('Bearer ')
    ? header.slice(7)
    : new URL(request.url).searchParams.get('secret') || ''
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
