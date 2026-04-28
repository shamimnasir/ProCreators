# ProCreators - Deployment Checklist & Future Changes Guide

## 🚀 Pre-Deployment Checklist

### ✅ Completed Security Fixes
- [x] Admin API authentication (requireAdmin middleware)
- [x] IDOR vulnerabilities fixed (tenant isolation)
- [x] CSRF protection on state-changing endpoints
- [x] Demo user fallbacks removed
- [x] Session invalidation on password change
- [x] Input sanitization and validation
- [x] Error message sanitization (no key leakage)
- [x] Rate limiting on sensitive endpoints

### ⚠️ Pre-Deploy Actions Required

1. **Environment Variables** - Verify all are set correctly:
   ```bash
   # Check your .env has real values for:
   STRIPE_API_KEY=sk_live_...        # Your Stripe key
   STRIPE_WEBHOOK_SECRET=whsec_...   # Stripe webhook secret
   MONGO_URL=...                     # Your MongoDB connection
   NEXT_PUBLIC_BASE_URL=...          # Your production domain
   ```

2. **API Key Rotation** (Recommended):
   - See `/app/SECRETS_MANAGEMENT.md` for rotation guide
   - Priority: Stripe > AI Services > Media APIs

3. **Stripe Webhook Setup**:
   - Add your production URL to Stripe webhook endpoints
   - Events: `checkout.session.completed`, `customer.subscription.*`

---

## 📁 File Structure - Where to Make Changes

### 🎨 **Frontend / UI Changes**

| What to Change | Location |
|----------------|----------|
| Homepage | `/app/app/page.js` |
| Dashboard | `/app/app/dashboard/page.js` |
| Navigation/Header | `/app/components/layout/Navbar.jsx` |
| Sidebar | `/app/components/layout/Sidebar.js` |
| Footer | `/app/components/layout/Footer.jsx` |
| Login/Signup | `/app/app/login/page.js`, `/app/app/signup/page.js` |
| Pricing Page | `/app/app/pricing/page.js` |
| Global Styles | `/app/app/globals.css` |
| Theme Colors | `/app/tailwind.config.js` |

### 🛠️ **Tool Pages**

| Tool | Location |
|------|----------|
| All Tools | `/app/app/dashboard/tools/[tool-name]/page.js` |
| Carousels | `/app/app/dashboard/tools/carousels/page.js` |
| Story Reels | `/app/app/dashboard/tools/story-reels/page.js` |
| AI Video Studio | `/app/app/dashboard/tools/ai-video-studio/page.js` |
| LinkedIn Posts | `/app/app/dashboard/tools/linkedin-posts/page.js` |

### 🔧 **Backend / API Changes**

| What to Change | Location |
|----------------|----------|
| Authentication | `/app/app/api/auth/route.js` |
| Credits System | `/app/lib/credits.js` |
| Tool Generation | `/app/app/api/generate/[tool]/route.js` |
| Stripe Payments | `/app/app/api/stripe/checkout/route.js` |
| Webhooks | `/app/app/api/stripe/webhook/route.js` |
| User Profile | `/app/app/api/user/profile/route.js` |
| Library | `/app/app/api/library/` |

### ⚙️ **Configuration Files**

| Configuration | Location |
|---------------|----------|
| Site Settings | `/app/lib/config/site.js` |
| Credit Costs | `/app/lib/credits.js` (TOOL_COSTS object) |
| Pricing Plans | `/app/lib/stripe.js` |
| Rate Limits | `/app/lib/rateLimit.js` |
| Feature Flags | `/app/lib/featureControls.js` |
| Email Templates | `/app/lib/email.js` |

### 🔐 **Security Files**

| Security Feature | Location |
|------------------|----------|
| Auth Middleware | `/app/lib/auth-middleware.js` |
| CSRF Protection | `/app/lib/csrf-verify.js` |
| Tenant Isolation | `/app/lib/tenant-isolation.js` |
| Input Sanitization | `/app/lib/sanitize.js` |
| Validation Schemas | `/app/lib/validation.js` |
| API Key Security | `/app/lib/secure-keys.js` |

---

## 💰 **Changing Prices / Credits**

### Modify Credit Costs per Tool
```javascript
// File: /app/lib/credits.js
// Look for TOOL_COSTS object:

const TOOL_COSTS = {
  'carousels': 30,           // Change this number
  'quick-reels': 40,
  'ai-video-studio': 75,
  // ... add or modify tools
}
```

### Modify Subscription Plans
```javascript
// File: /app/lib/stripe.js
// Look for SUBSCRIPTION_PLANS object
```

### Modify Pricing Page Display
```
// File: /app/app/pricing/page.js
```

---

## 🎨 **Common UI Customizations**

### Change Logo
```
// Files to update:
/app/public/logo.svg          // Main logo file
/app/components/layout/Navbar.jsx   // If logo is inline
```

### Change Brand Colors
```javascript
// File: /app/tailwind.config.js
// Modify the colors section in theme.extend
```

### Change Homepage Hero Text
```javascript
// File: /app/app/page.js
// Look for the hero section JSX
```

---

## 🔌 **Adding New Features**

### Add a New Tool
1. Create tool page: `/app/app/dashboard/tools/[new-tool]/page.js`
2. Create API: `/app/app/api/generate/[new-tool]/route.js`
3. Add credit cost: `/app/lib/credits.js`
4. Add to navigation: `/app/lib/config/site.js`

### Add a New API Integration
1. Check `/app/lib/services/index.js` for pattern
2. Add API key to `.env`
3. Create service function in `/app/lib/services/`

---

## 🚨 **Troubleshooting**

### Server Won't Start
```bash
# Check logs
tail -n 100 /var/log/supervisor/nextjs.out.log

# Restart server
sudo supervisorctl restart nextjs
```

### Database Connection Issues
```bash
# Check MongoDB is running
sudo supervisorctl status mongodb

# Verify MONGO_URL in .env
```

### API Errors
1. Check browser Network tab for response
2. Check server logs: `/var/log/supervisor/nextjs.out.log`
3. Verify API key is set in `.env`

---

## 📊 **Monitoring in Production**

### Key Logs
- Server: `/var/log/supervisor/nextjs.out.log`
- Errors: `/var/log/supervisor/nextjs.err.log`

### Security Events
- Check `security_logs` collection in MongoDB
- Admin panel: `/dashboard/admin` (requires admin user)

---

## 📞 **Support Files Created**

| Document | Purpose |
|----------|---------|
| `/app/SECURITY_AUDIT.md` | Full security assessment |
| `/app/SECRETS_MANAGEMENT.md` | API key rotation guide |
| `/app/DEPLOYMENT_GUIDE.md` | This file |

---

## ✅ **Final Deployment Checklist**

- [ ] All environment variables are set
- [ ] Stripe webhook URL is configured
- [ ] MongoDB is accessible
- [ ] Test login/signup flow
- [ ] Test a paid tool to verify credits work
- [ ] Verify email sending works (password reset)
- [ ] Check admin panel access

---

*Last Updated: March 2026*
*Version: 1.0.0*
