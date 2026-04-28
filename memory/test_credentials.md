# Test Credentials

No pre-seeded test users exist. For testing protected endpoints:

1. Register a fresh test user via `POST /api/auth/register` (or POST /api/auth with `{action:"signup",...}`) using a random email + a password meeting these rules:
   - 8-128 chars
   - At least one letter AND one number
2. If email verification blocks login, set `emailVerified: true` directly in MongoDB (DB from `process.env.DB_NAME`, collection `users`, _id == userId).
3. Login via `POST /api/auth/login` to receive both:
   - `sessionToken` in the JSON body (use as `Authorization: Bearer <token>`)
   - `session_token` httpOnly cookie (set automatically — sent via cookies if you use `credentials:'include'`)

## Admin testing
For admin-only routes (`/api/admin/*`), after registering, set `role: 'admin'` directly in the MongoDB `users` collection for the test user.

## Notes
- Auth middleware: `/app/lib/auth-middleware.js` — `verifySession()` reads BOTH Authorization Bearer header AND session_token cookie
- Edge proxy: `/app/proxy.js` — pre-rejects unauthenticated `/api/admin/*` requests + per-IP rate-limits + CORS
- MongoDB users collection: `users`
- MongoDB sessions collection: `sessions` (`{token, userId, expiresAt}`)
