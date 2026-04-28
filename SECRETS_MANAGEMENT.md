# Secrets Management Guide - ProCreators Platform

## ⚠️ CRITICAL: API Keys Rotation Required

The following API keys in your `.env` file need to be rotated immediately:

### Keys to Rotate

| Service | Key Pattern | Where to Generate |
|---------|-------------|-------------------|
| Stripe Live | `sk_live_*` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| Stripe Webhook | `whsec_*` | Stripe Dashboard > Webhooks > Signing Secret |
| Replicate | `r8_*` | [Replicate Account](https://replicate.com/account) |
| ElevenLabs | 64-char hex | [ElevenLabs Settings](https://elevenlabs.io/app/settings) |
| FAL.ai | `*:*` format | [FAL Dashboard](https://fal.ai/dashboard/keys) |
| Mailgun | 32-char hex | [Mailgun API Keys](https://app.mailgun.com/app/account/security/api_keys) |
| Pexels | API key | [Pexels API](https://www.pexels.com/api/new/) |
| Freesound | API key | [Freesound API](https://freesound.org/apiv2/apply/) |
| Pixabay | API key | [Pixabay API](https://pixabay.com/api/docs/) |
| Shotstack | API key | [Shotstack Dashboard](https://dashboard.shotstack.io/) |
| Google API | `AIza*` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |

---

## 🔐 Best Practices for Secrets Management

### 1. Never Commit Secrets to Git

```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

### 2. Use Environment-Specific Files

```
.env                  # Shared defaults (NO SECRETS)
.env.local           # Local development (gitignored)
.env.production      # Production secrets (gitignored)
```

### 3. For Production Deployment

Use your hosting provider's secrets management:

**Vercel:**
```bash
vercel env add STRIPE_API_KEY production
```

**AWS:**
```bash
aws secretsmanager create-secret --name prod/stripe-key --secret-string "sk_live_xxx"
```

**Docker:**
```yaml
# docker-compose.yml
services:
  app:
    environment:
      - STRIPE_API_KEY_FILE=/run/secrets/stripe_key
    secrets:
      - stripe_key
```

---

## 🛡️ Recommended Security Controls

### 1. API Key Restrictions

**Stripe:**
- Enable IP restrictions in Stripe Dashboard
- Use separate keys for test/live environments
- Enable webhook signing

**Google:**
- Restrict to specific APIs
- Restrict to specific referrers/IPs

### 2. Key Rotation Schedule

| Priority | Keys | Frequency |
|----------|------|-----------|
| P0 | Payment (Stripe) | Every 90 days |
| P1 | LLM APIs (OpenAI, FAL) | Every 90 days |
| P2 | Media APIs (Pexels, etc.) | Every 180 days |
| P3 | Email (Mailgun) | Every 180 days |

### 3. Monitoring

- Enable billing alerts on all paid APIs
- Set up usage quotas
- Monitor for anomalous usage patterns

---

## 📝 Secure .env Template

Create a new `.env` file with placeholder values:

```env
# Database (configured by hosting)
MONGO_URL=mongodb://localhost:27017

# App URLs (configured by hosting)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

# === SECRETS - OBTAIN FROM RESPECTIVE DASHBOARDS ===

# Stripe (https://dashboard.stripe.com/apikeys)
STRIPE_API_KEY=sk_live_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
STRIPE_WEBHOOK_SECRET_2=whsec_REPLACE_ME

# LLM Services
EMERGENT_LLM_KEY=sk-emergent-REPLACE_ME
FAL_KEY=REPLACE_ME

# Media Services
REPLICATE_API_TOKEN=REPLACE_ME
PEXELS_API_KEY=REPLACE_ME
PIXABAY_API_KEY=REPLACE_ME
FREESOUND_API_KEY=REPLACE_ME

# Video Services
SHOTSTACK_API_KEY=REPLACE_ME
SHOTSTACK_OWNER_ID=REPLACE_ME
SHOTSTACK_ENV=sandbox

# Voice Services
ELEVENLABS_API_KEY=REPLACE_ME
GOOGLE_APPLICATION_CREDENTIALS=/app/google-cloud-tts-credentials.json
GOOGLE_API_KEY=REPLACE_ME

# Email
MAILGUN_API_KEY=REPLACE_ME
MAILGUN_DOMAIN=your-domain.com
FROM_EMAIL="YourApp <noreply@your-domain.com>"

# Security
CSRF_SECRET=GENERATE_RANDOM_64_CHAR_HEX
CRON_SECRET=GENERATE_RANDOM_STRING

# Supabase (optional)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🔄 Key Rotation Checklist

When rotating keys:

1. [ ] Generate new key in service dashboard
2. [ ] Update `.env` locally and test
3. [ ] Deploy to staging and verify
4. [ ] Deploy to production
5. [ ] Revoke old key in service dashboard
6. [ ] Update documentation
7. [ ] Log rotation in security audit

---

## 📞 Emergency Key Compromise Response

If you suspect a key has been compromised:

1. **Immediately** revoke the key in the service dashboard
2. Generate a new key
3. Update all environments
4. Review service logs for unauthorized usage
5. Check billing for unexpected charges
6. Document the incident
