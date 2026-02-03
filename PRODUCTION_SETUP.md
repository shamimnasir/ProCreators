# ProCreators Production Setup Guide

## 1. Stripe Subscription Products Setup

### Step 1: Create Products in Stripe Dashboard

Go to https://dashboard.stripe.com/products and create the following products:

#### Creator Plan ($19/month)
```
Product Name: Creator Plan
Description: 400 credits/month - ProCreators Creator membership
```

Create TWO prices:
- **Monthly**: $19.00 USD, Recurring monthly
- **Yearly**: $190.00 USD, Recurring yearly (Save 17%)

Copy the Price IDs (e.g., `price_1ABC...`) and update them in `/lib/membership.js`:
```javascript
creator: {
  stripePriceId: 'price_XXXX_monthly',      // Replace with actual
  stripeYearlyPriceId: 'price_XXXX_yearly', // Replace with actual
  ...
}
```

#### Pro Plan ($49/month)
```
Product Name: Pro Plan
Description: 1,000 credits/month - ProCreators Pro membership
```

Create TWO prices:
- **Monthly**: $49.00 USD, Recurring monthly
- **Yearly**: $490.00 USD, Recurring yearly

#### Business Plan ($99/month)
```
Product Name: Business Plan
Description: 3,000 credits/month - ProCreators Business membership
```

Create TWO prices:
- **Monthly**: $99.00 USD, Recurring monthly
- **Yearly**: $990.00 USD, Recurring yearly

---

## 2. Stripe Webhook Configuration

### Step 1: Create Webhook Endpoint

Go to https://dashboard.stripe.com/webhooks

1. Click **"Add endpoint"**
2. Enter your endpoint URL:
   ```
   https://your-domain.com/api/stripe/webhook
   ```

3. Select these events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.expired`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `payment_intent.payment_failed`

4. Click **"Add endpoint"**

### Step 2: Copy Webhook Signing Secret

After creating the webhook, click on it and find the **"Signing secret"** (starts with `whsec_`).

Update your `.env` file:
```
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

### Step 3: Test Webhook

In Stripe Dashboard, click **"Send test webhook"** and select `checkout.session.completed`.

Check your server logs to verify it's received.

---

## 3. Daily Cron Job Setup

The cron job handles:
- Subscription renewals (credit refills)
- Expiring free trial credits
- Auto-adjusting credit pricing
- Resetting daily generation limits
- Sending low credit alerts

### Option A: Using cron-job.org (Free)

1. Go to https://cron-job.org and create an account
2. Click **"Create cronjob"**
3. Configure:
   ```
   Title: ProCreators Daily Tasks
   URL: https://your-domain.com/api/cron/daily?secret=YOUR_CRON_SECRET
   Schedule: Every day at 00:00 (midnight)
   Request Method: GET
   Request Timeout: 30 seconds
   ```
4. Enable notifications for failures

### Option B: Using Vercel Cron (if deployed on Vercel)

Create `vercel.json` in your project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily?secret=YOUR_CRON_SECRET",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Option C: Using GitHub Actions

Create `.github/workflows/cron.yml`:
```yaml
name: Daily Cron Job
on:
  schedule:
    - cron: '0 0 * * *'  # Every day at midnight UTC
  workflow_dispatch:      # Allow manual trigger

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Run daily tasks
        run: |
          curl -X GET "https://your-domain.com/api/cron/daily?secret=${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` to your GitHub repository secrets.

### Environment Variable

Make sure this is set in your production `.env`:
```
CRON_SECRET=your-secure-random-string-here
```

Generate a secure secret:
```bash
openssl rand -hex 32
```

---

## 4. Environment Variables Checklist

Ensure these are all set in production:

```env
# MongoDB
MONGO_URL=mongodb+srv://...

# Authentication
JWT_SECRET=your-jwt-secret

# Stripe
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mailgun (for emails)
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...

# Cron
CRON_SECRET=...

# AI APIs
GEMINI_API_KEY=...
FAL_KEY=...
```

---

## 5. Testing the Setup

### Test Subscription Flow:
1. Go to `/pricing`
2. Click "Start Creator"
3. Complete Stripe checkout (use test card `4242 4242 4242 4242`)
4. Verify redirect to `/dashboard/billing?subscription=success`
5. Check credits are added

### Test Webhook:
```bash
# In Stripe Dashboard, send test webhook
# Check your logs for "Subscription activated" message
```

### Test Cron Job:
```bash
curl "https://your-domain.com/api/cron/daily?secret=YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "results": {
    "tasks": [
      {"name": "subscription_renewals", "renewed": 0},
      {"name": "expire_free_credits", "expired": 0},
      {"name": "auto_pricing", "dryRun": true},
      {"name": "reset_daily_counters", "reset": 0},
      {"name": "low_credit_alerts", "notified": 0}
    ]
  }
}
```

---

## 6. Monitoring

### Logs to Watch:
- Webhook logs: Check MongoDB `webhook_logs` collection
- Cron logs: Check MongoDB `cron_logs` collection
- Cost tracking: Check MongoDB `api_cost_tracking` collection

### Admin Dashboard:
- `/dashboard/admin/costs` - Monitor API costs and margins
- `/dashboard/admin/users` - Manage user subscriptions

---

## Quick Commands

```bash
# Test cron locally
curl "http://localhost:3000/api/cron/daily?secret=procreators-cron-2024-secure"

# Check membership status
curl "http://localhost:3000/api/membership?userId=demo-user-001"

# Check subscription plans
curl "http://localhost:3000/api/subscription/checkout"
```
